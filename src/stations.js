var utils = require('./utils');
var https = require('https');
var querystring = require('querystring');
var cheerio = require('cheerio');
var Q = require('q');

module.exports.all = function(options) {
  var defer = Q.defer();

  var path = '/stations/';

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
    utils.respBody(res).then(function(body) {
      var html = body.toString();

      var mapMatches = /var map = initMap\(\[(.+?)\]/.exec(html);
      var stations = JSON.parse('[' + mapMatches[1] + ']');

      defer.resolve(stations);
    });
  });

  utils.setTimeout(req, options.timeout || 5000);

  req.on('error', function(err) {
    defer.reject(err);
  });

  req.end();

  return defer.promise;
};

function near(options) {
  var defer = Q.defer();

  var path = '/reservation/stations/available/' + options.type + '/?' + querystring.stringify({
    address: options.address
  });

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
    options.debug && console.log('HTTP status', res.statusCode);

    utils.respBody(res).then(function(body) {
      var stations = JSON.parse(body.toString());
      defer.resolve(stations.map(function(s) {
        return (s.type = options.type) && s;
      }));
    }).catch(function(err) {
      defer.reject(err);
    })
  });

  utils.setTimeout(req, options.timeout || 5000);

  req.on('error', function(err) {
    defer.reject(err);
  });

  req.end();

  return defer.promise;
}

module.exports.near = function(options) {
  if (options.type != 'car' && options.type != 'park') {
    options.type = 'car';
    return near(options).then(function(carStations) {
      options.type = 'park';
      return near(options).then(function(parkStations) {
        return parkStations.concat(carStations);
      });
    });
  } else {
    return near(options);
  }
};
