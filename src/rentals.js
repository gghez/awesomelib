var utils = require('./utils');
var https = require('https');
var querystring = require('querystring');
var cheerio = require('cheerio');
var Q = require('q');

module.exports = function(options) {

  if (options.start === undefined) {
    var now = new Date();
    options.start = (now.getMonth() + 1) + '/01/' + now.getFullYear();
  }

  if (options.end === undefined) {
    var now = new Date();
    var d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    options.end = (now.getMonth() + 1) + '/' + d.getDate() + '/' + now.getFullYear();
  }

  function rentalsPage(page) {
    var defer = Q.defer();

    var path = '/account/history/rentals/?' + querystring.stringify({
      start: options.start,
      end: options.end,
      action: 'refine',
      page: page
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

        var hasPager = $('.pager').length;
        var currentPage = $('.pager > li > strong').text();
        if ((hasPager || page > 1) && currentPage != page) {
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

          rentalsPage(page + 1).then(function(nextRentals) {
            defer.resolve(nextRentals.concat(rentals));
          }).catch(function(err) {
            options.debug && console.error('Rental page', page + 1, 'failed.', err);
            defer.resolve(rentals);
          });
        }
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
  }

  return rentalsPage(1);
};
