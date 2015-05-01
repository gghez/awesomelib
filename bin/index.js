var Q = require('q');
var http = require('http');
var https = require('https');
var querystring = require('querystring');
var cheerio = require('cheerio');

var getopt = require('node-getopt').create([
  ['u', 'username=ARG', 'Specify account user name.'],
  ['p', 'password=ARG', 'Specify account user password.'],
  ['', 'info', 'Display personal information.'],
  ['', 'rentals', 'Display rentals.'],
  ['', 'bills', 'Display bills.'],
	['', 'bill=ARG', 'Download bill.'],
  ['', 'start=ARG', 'Filter with start date (US format: mm/dd/yyyy).'],
  ['', 'end=ARG', 'Filter with end date (US format: mm/dd/yyyy).'],
  ['', 'help', 'Display this help']
]).bindHelp();
var opt = getopt.parseSystem();

var Session = require('./src/session');

if (!opt.options.username || !opt.options.password) {
  console.error('Missing username and password.');
  getopt.showHelp();
} else {

  var session = new Session();

  session.login(opt.options.username, opt.options.password).then(function() {
    if (opt.options.info) {
      session.info().then(function(userInfo) {
        console.log(userInfo);
      });
    } else if (opt.options.rentals) {
      session.rentals(opt.options.start, opt.options.end).then(function(rentals) {
        console.log(rentals);
      });
    } else if (opt.options.bills) {
      session.bills(opt.options.start, opt.options.end).then(function(bills) {
        console.log(bills);
      });
    } else if (opt.options.bill) {
      session.bill(opt.options.bill).then(function(bill) {
        console.log(bill);
      });
    } else {
      getopt.showHelp();
    }

  });
}
