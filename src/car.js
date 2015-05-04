var utils = require('./utils');
var https = require('https');
var querystring = require('querystring');
var cheerio = require('cheerio');
var Q = require('q');

module.exports.reserve = function(options) {
  var defer = Q.defer();

  var path = '/account/reservations/car/';

  options.debug && console.log('[URL]', path);

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
    options.debug && console.log('HTTP #1 status', res.statusCode);

    if (res.statusCode != 302){
      defer.reject('Car reservation failed (HTTP #1:' + res.statusCode + ')');
    }else{
      var location = res.headers['location'];

      var postData = querystring.stringify({
        csrfmiddlewaretoken: options.cookies['csrftoken'],
        update: 'False',
        station: options.stationId
      });

      options.debug && console.log('[URL]', location);

      var reserveReq = https.request({
        method:'POST',
        host:'www.autolib.eu',
        path:location,
        headers:{
          'Cookie': utils.stringifyCookies(options.cookies),
          'Accept-Language': 'en-US,en',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postData.length
        }
      });

      reserveReq.on('response', function(res){
        options.debug && console.log('HTTP #2 status', res.statusCode);

        if (res.statusCode == 302){
          // location: https://www.autolib.eu/account/reservations/178766/carreservation/13667287/confirm/
          var location = res.headers['location'];

          options.debug && console.log('Reservation URL', location);

          var matches = /\/account\/reservations\/(\d+)\/carreservation\/(\d+)\/confirm/.exec(location);
          defer.resolve({
            subscriptionId: matches[1],
            reservationId: matches[2]
          });
        }else{
          defer.reject('Car reservation failed (HTTP #2:' + res.statusCode + ')');
        }
      });

      utils.setTimeout(reserveReq, options.timeout || 5000);

      reserveReq.on('error', function(err) {
        options.debug && console.error('Request #2 Error');
        defer.reject(err);
      });

      reserveReq.write(postData);

      reserveReq.end();
    }

  });

  utils.setTimeout(req, options.timeout || 5000);

  req.on('error', function(err) {
    options.debug && console.error('Request #1 Error');
    defer.reject(err);
  });

  req.end();

  return defer.promise;
};

module.exports.cancel = function(subscriptionId, reservationId){
  // GET https://www.autolib.eu/account/reservations/178766/carreservation/13667287/cancel/

};
