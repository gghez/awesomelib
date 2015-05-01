var Q = require('q');
var utils = require('./utils');
var https = require('https');
var cheerio = require('cheerio');

module.exports = function (cookiesContainer) {
  var defer = Q.defer();

  var req = https.request({
    method: 'GET',
    host: 'www.autolib.eu',
    path: '/account/information/',
    headers: {
      'Cookie': utils.stringifyCookies(cookiesContainer)
    }
  }, function(res) {
    utils.respBody(res).then(function(body) {
      var html = body.toString();
      var $ = cheerio.load(html);

      var userInfo = {
        lastname: $('.account-info p').eq(0).text().split(':')[1].trim(),
        firstname: $('.account-info p').eq(1).text().split(':')[1].trim(),
        street: $('.account-info p').eq(2).text().split(':')[1].trim(),
        building: $('.account-info p').eq(3).text().split(':')[1].trim(),
        neighborhood: $('.account-info p').eq(4).text().split(':')[1].trim(),
        zipcode: $('.account-info p').eq(5).text().split(':')[1].trim(),
        city: $('.account-info p').eq(6).text().split(':')[1].trim(),
        birthday: $('.account-info p').eq(7).text().split(':')[1].trim(),
        land_line: $('.account-info p').eq(8).text().split(':')[1].trim(),
        mobile_line: $('.account-info p').eq(9).text().split(':')[1].trim(),
        email: $('.account-info p').eq(10).text().split(':')[1].trim(),
        language: $('.account-info p').eq(11).text().split(':')[1].trim()
      };

      defer.resolve(userInfo);
    }).catch(function(err) {
      defer.reject(err);
    }).then(function(){
      //res.close();
    });
  });

  req.on('error', function(err) {
    defer.reject(err);
  });

  req.end();

  return defer.promise;
};
