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
      defer.resolve(matches && matches[1]);
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

    var referer = 'https://www.autolib.eu/account/reservations/' + subscriptionId + '/carreservation/';

    var postData = querystring.stringify({
      csrfmiddlewaretoken: options.cookies['csrftoken'],
      update: 'False',
      station: options.stationId
    });

    var path = referer;
    options.debug && console.log('[POST]', path);

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
        // location: https://www.autolib.eu/account/reservations/178766/carreservation/13667287/confirm/
        var confirmUrl = res.headers['location'];

        options.debug && console.log('Confirmation URL', confirmUrl);

        var matches = /\/account\/reservations\/(\d+)\/carreservation\/(\d+)\/confirm/.exec(confirmUrl);
        defer.resolve({
          subscriptionId: matches[1],
          reservationId: matches[2]
        });
      } else {
        defer.reject('Car reservation failed (HTTP:' + res.statusCode + ')');
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

    var path = '/account/reservations/' + subscriptionId + '/carreservation/' + options.reservationId + '/cancel/';

    var postData = querystring.stringify({
      csrfmiddlewaretoken: options.cookies['csrftoken']
    });

    options.debug && console.log('[POST]', path);

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

        var reservations = $('article > table > tbody > tr').map(function(i, tr) {
          var timeString = $(tr).find('td').eq(1).text();
          var timeMatches = /from\s+(\d{2}:\d{2})\s*to\s+(\d{2}:\d{2})/i.exec(timeString);
          var time = {
            from: timeMatches[1],
            to: timeMatches[2]
          };
          return {
            date: $(tr).find('td').eq(0).text().trim(),
            time: time,
            station: $(tr).find('td').eq(2).text().trim(),
            subscription: $(tr).find('td').eq(3).text().trim().replace(/\s+/g, ' '),
            status: $(tr).find('td').eq(4).text().trim()
          };
        }).get();

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
