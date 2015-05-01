var utils = require('./utils');
var https = require('https');
var querystring = require('querystring');
var cheerio = require('cheerio');
var Q = require('q');

module.exports = function(start, end, cookiesContainer) {

  function rentalsPage(page, start, end) {
    var defer = Q.defer();

    if (start === undefined) {
      var now = new Date();
      start = now.getMonth() + '/01/' + now.getFullYear();
    }

    if (end === undefined) {
      var now = new Date();
      var d = new Date(now.getFullYear(), now.getMonth(), 0);
      end = now.getMonth() + '/' + d.getDate() + '/' + now.getFullYear();
    }

    var queryString = querystring.stringify({
      start: start,
      end: end,
      action: 'refine',
      page: page
    });

    var req = https.request({
      method: 'GET',
      host: 'www.autolib.eu',
      path: '/account/history/rentals/?' + queryString,
      headers: {
        'Cookie': utils.stringifyCookies(cookiesContainer),
        'Accept-Language': 'en-US,en'
      }
    }, function(res) {

      utils.respBody(res).then(function(body) {
        var html = body.toString();
        var $ = cheerio.load(html);

        var currentPage = $('.pager > li > strong').text();
        if (currentPage != page) {
          defer.reject('No more page.');
        } else {
          var rentals = $('#rentals-history > tbody > tr').map(function(i, tr) {
            return {
              start: $(tr).find('td').eq(0).text().trim(),
              duration: $(tr).find('td').eq(1).text().trim(),
              from: $(tr).find('td').eq(2).text().trim(),
              to: $(tr).find('td').eq(3).text().trim(),
              amount: Number($(tr).find('td').eq(4).text().replace(/[^0-9\.\,]/g, '').replace(',', '.'))
            };
          }).get();

          rentalsPage(page + 1, start, end).then(function(nextRentals) {
            defer.resolve(nextRentals.concat(rentals));
          }).catch(function(err) {
            console.error('Rental page', page + 1, 'failed.', err);
            defer.resolve(rentals);
          });
        }
      }).catch(function(err) {
        defer.reject('Body Parsing failed.', err);
      })
    });

    req.on('error', function(err) {
      defer.reject('Request Error', err);
    });

    req.end();

    return defer.promise;
  }

  return rentalsPage(1, start, end);
};
