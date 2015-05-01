var Q = require('q');
var querystring = require('querystring');
var https = require('https');
var utils = require('./utils');

module.exports = function(options) {
  var defer = Q.defer();

  var postData = querystring.stringify({
    csrfmiddlewaretoken: 'V2Tg9bQiS8V1KbTHkY8HkNZNr3dImbKb',
    username: options.username,
    password: options.password,
    next: '/en/'
  });

  var path = '/account/login/';

  options.debug && console.log('[URL]', path);

  var req = https.request({
    method: 'POST',
    host: 'www.autolib.eu',
    path: path,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length,
      'Referer': 'https://www.autolib.eu/en/',
      'Cookie': 'csrftoken=V2Tg9bQiS8V1KbTHkY8HkNZNr3dImbKb;'
    }
  });

  req.on('response', function(res) {
    options.debug && console.log('HTTP status', res.statusCode);

    if (res.statusCode == 302) {
      defer.resolve(utils.cookiesContainer(res.headers['set-cookie']));
    } else {
      defer.reject('Login failed (HTTP:' + res.statusCode + ')');
    }
  });

  utils.setTimeout(req, options.timeout || 5000);

  req.on('error', function(err) {
    defer.reject(err);
  });

  req.write(postData);
  req.end();

  return defer.promise;
};
