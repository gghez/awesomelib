var Q = require('q');
var querystring = require('querystring');
var https = require('https');
var utils = require('./utils');

module.exports = function(username, password) {
  var defer = Q.defer();

  var postData = querystring.stringify({
    csrfmiddlewaretoken: 'V2Tg9bQiS8V1KbTHkY8HkNZNr3dImbKb',
    username: username,
    password: password,
    next: '/en/'
  });

  var req = https.request({
    method: 'POST',
    host: 'www.autolib.eu',
    path: '/account/login/',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length,
      'Referer': 'https://www.autolib.eu/en/',
      'Cookie': 'csrftoken=V2Tg9bQiS8V1KbTHkY8HkNZNr3dImbKb;'
    }
  }, function(res) {
    if (res.statusCode == 302) {
      defer.resolve(utils.cookiesContainer(res.headers['set-cookie']));
    } else {
      defer.reject('Login failed (HTTP:' + res.statusCode + ')');
    }
  });

  req.on('error', function(err) {
    defer.reject(err);
  });

  req.write(postData);
  req.end();

  return defer.promise;
};
