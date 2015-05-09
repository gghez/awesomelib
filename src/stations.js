var utils = require('./utils');
var https = require('https');
var querystring = require('querystring');
var cheerio = require('cheerio');
var Q = require('q');

module.exports.near = function(options) {
  var defer = Q.defer();

  var path = '/reservation/stations/available/car/?' + querystring.stringify({
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
      var stations = body.toString();
      defer.resolve(JSON.parse(stations));
    }).catch(function(err) {
      options.debug && console.error('Body Parsing failed.');
      defer.reject(err);
    })
  });

  utils.setTimeout(req, options.timeout || 5000);

  req.on('error', function(err) {
    options.debug && console.error('Request Error');
    defer.reject(err);
  });

  req.end();

  return defer.promise;
};
