var utils = require('./utils');
var https = require('https');
var querystring = require('querystring');
var cheerio = require('cheerio');
var Q = require('q');

module.exports.download = function(options) {
  var defer = Q.defer();

  var path = '/account/bills/' + number + '/';

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
      defer.resolve(body);
    }).catch(function(err) {
      defer.reject('Body parsing failed.', err);
    })
  });

  utils.setTimeout(req, options.timeout || 5000);

  req.on('error', function(err) {
    defer.reject('Request Error', err);
  });

  req.end();

  return defer.promise;
};

module.exports.filter = function(options) {

  var defer = Q.defer();

  if (options.start === undefined) {
    var now = new Date();
    options.start = now.getMonth() + '/01/' + now.getFullYear();
  }

  if (options.end === undefined) {
    var now = new Date();
    var d = new Date(now.getFullYear(), now.getMonth(), 0);
    options.end = now.getMonth() + '/' + d.getDate() + '/' + now.getFullYear();
  }

  var path = '/account/bills/?' + querystring.stringify({
    start: options.start,
    end: options.end
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
      var html = body.toString();
      var $ = cheerio.load(html);

      var bills = $('.table-bills > tbody > tr').map(function(i, tr) {
        return {
          number: $(tr).find('td').eq(0).text().trim(),
          date: $(tr).find('td').eq(1).text().trim(),
          status: $(tr).find('td').eq(2).text().trim(),
          amount: Number($(tr).find('td').eq(3).text().replace(/[^0-9\.\,]/g, '').replace(',', '.'))
        };
      }).get();

      defer.resolve(bills);
    }).catch(function(err) {
      options.debug && console.error('Body parsing error.');
      defer.reject(err);
    });
  });

  utils.setTimeout(req, options.timeout || 5000);

  req.on('error', function(err) {
    options.debug && console.error('Request error.');
    defer.reject(err);
  });

  req.end();

  return defer.promise;
};
