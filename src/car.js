var utils = require('./utils');
var https = require('https');
var querystring = require('querystring');
var cheerio = require('cheerio');
var Q = require('q');

function subscription(options) {
  var defer = Q.defer();

  var path = '/account/reservations/car/';

  options.debug && console.log('[GET]', path);

  var req = https.request({
    method: 'GET',
    host: 'www.autolib.eu',
    path: path,
    headers: {
      'Cookie': utils.stringifyCookies(options.cookies),
      'Accept-Language': 'en-US,en'
    }
  });

  req.on('response', function(res) {
    options.debug && console.log('HTTP status', res.statusCode);

    if (res.statusCode != 302) {
      defer.reject('Subscription retrieving failed (HTTP:' + res.statusCode + ')');
    } else {
      var redirectLocation = res.headers['location'];
      var matches = /\/(\d+)\//.exec(redirectLocation);
      var subscriptionId = matches && matches[1];
      options.debug && console.log('SubscriptionID', subscriptionId);
      defer.resolve(subscriptionId);
    }
  });

  utils.setTimeout(req, options.timeout || 5000);

  req.on('error', function(err) {
    options.debug && console.error('Subscription request Error');
    defer.reject(err);
  });

  req.end();

  return defer.promise;
}

module.exports.reserve = function(options) {

  return subscription(options).then(function(subscriptionId) {
    var defer = Q.defer();

    var referer = 'https://www.autolib.eu/account/reservations/' + subscriptionId +
      '/' + options.type + 'reservation/?full_address=' + encodeURIComponent(options.stationId);

    var postData = querystring.stringify({
      csrfmiddlewaretoken: options.cookies['csrftoken'],
      update: 'False',
      station: options.stationId
    });

    var path = referer;
    options.debug && console.log('[POST]', path, postData);

    var req = https.request({
      method: 'POST',
      host: 'www.autolib.eu',
      path: path,
      headers: {
        'Cookie': utils.stringifyCookies(options.cookies),
        'Accept-Language': 'en-US,en',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length,
        'Referer': referer
      }
    });

    req.on('response', function(res) {
      options.debug && console.log('HTTP status', res.statusCode);

      if (res.statusCode == 302) { // Good, reservation done.
        // location: https://www.autolib.eu/account/reservations/178766/(car|park)reservation/13667287/confirm/
        var confirmUrl = res.headers['location'];

        options.debug && console.log('Confirmation URL', confirmUrl);

        var matches = /\/account\/reservations\/(\d+)\/\w+reservation\/(\d+)\/confirm/.exec(confirmUrl);
        defer.resolve({
          subscriptionId: matches[1],
          reservationId: matches[2]
        });
      } else {
        defer.reject('Reservation of ' + options.type + ' failed (HTTP:' + res.statusCode + ')');
      }
    });

    utils.setTimeout(req, options.timeout || 5000);

    req.on('error', function(err) {
      options.debug && console.error('Reservation request Error');
      defer.reject(err);
    });

    req.write(postData);
    req.end();

    return defer.promise;
  });
};


module.exports.cancel = function(options) {
  return subscription(options).then(function(subscriptionId) {
    var defer = Q.defer();

    var path = '/account/reservations/' + subscriptionId + '/' + options.type + 'reservation/' + options.reservationId + '/cancel/';

    var postData = querystring.stringify({
      csrfmiddlewaretoken: options.cookies['csrftoken']
    });

    options.debug && console.log('[POST]', path, postData);

    var req = https.request({
      method: 'POST',
      host: 'www.autolib.eu',
      path: path,
      headers: {
        'Cookie': utils.stringifyCookies(options.cookies),
        'Accept-Language': 'en-US,en',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length,
        'Referer': 'https://www.autolib.eu/account/reservations/?s=' + options.subscriptionId
      }
    });

    req.on('response', function(res) {
      options.debug && console.log('HTTP status', res.statusCode);

      if (res.statusCode >= 200 && res.statusCode < 400) {
        defer.resolve();
      } else {
        defer.reject('Reservation cancellation failed (HTTP:' + res.statusCode + ')');
      }
    });

    utils.setTimeout(req, options.timeout || 5000);

    req.on('error', function(err) {
      options.debug && console.error('Cancel request Error');
      defer.reject(err);
    });

    req.write(postData);
    req.end();

    return defer.promise;
  });

};

module.exports.pending = function(options) {
  var defer = Q.defer();

  var path = '/account/reservations/';

  options.debug && console.log('[GET]', path);

  var req = https.request({
    method: 'GET',
    host: 'www.autolib.eu',
    path: path,
    headers: {
      'Cookie': utils.stringifyCookies(options.cookies),
      'Accept-Language': 'en-US,en'
    }
  });

  req.on('response', function(res) {
    options.debug && console.log('HTTP status', res.statusCode);

    if (res.statusCode == 200) {
      utils.respBody(res).then(function(body) {
        var html = body.toString();
        var $ = cheerio.load(html);

        function extractData(type, i, tr) {
          var timeString = $(tr).find('td').eq(1).text();
          var timeMatches = /from\s+(\d{2}:\d{2})\s*to\s+(\d{2}:\d{2})/i.exec(timeString);
          var time = {
            from: timeMatches[1],
            to: timeMatches[2]
          };

          var colls = $(tr).find('td');
          var statusCol = colls.eq(4);

          var res = {
            date: colls.eq(0).text().trim(),
            time: time,
            station: {
              name: colls.eq(2).text().trim()
            },
            subscription: colls.eq(3).text().trim().replace(/\s+/g, ' '),
            status: statusCol.find('span').text().trim().toLowerCase(),
            type: type
          };

          var statusCancelForm = statusCol.find('form');
          if (statusCancelForm.length) {
            var resMatches = /\/account\/reservations\/\d+\/\w+reservation\/(\d+)\/cancel/.exec(statusCancelForm.attr('action'));
            res.reservationId = resMatches[1];
          }

          return res;
        }

        var extractCarData = extractData.bind(undefined, 'car');
        var extractParkData = extractData.bind(undefined, 'park');

        var carReservations = $('table.account-table').eq(0).find('tbody > tr').map(extractCarData).get();
        var parkReservations = $('table.account-table').eq(1).find('tbody > tr').map(extractParkData).get();

        var reservations = carReservations.concat(parkReservations);

        defer.resolve(reservations);
      }).catch(function(err) {
        options.debug && console.error('Body Parsing failed.');
        defer.reject(err);
      });
    } else {
      defer.reject('Pending reservations request failed (HTTP:' + res.statusCode + ')');
    }
  });

  utils.setTimeout(req, options.timeout || 5000);

  req.on('error', function(err) {
    options.debug && console.error('Pending reservations request Error');
    defer.reject(err);
  });

  req.end();

  return defer.promise;
};
