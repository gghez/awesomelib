#!/usr/bin/env node

var Q = require('q');
var utils = require('../src/utils');
var Session = require('../src/session');

var getopt = require('node-getopt').create([
  ['u', 'username=ARG', 'Specify account user name.'],
  ['p', 'password=ARG', 'Specify account user password.'],
  ['', 'info', 'Display personal information.'],
  ['', 'rentals', 'Display rentals.'],
  ['', 'bills', 'Display bills.'],
  ['', 'bill=ARG', 'Download bill.'],
  ['', 'near=ARG', 'Stations near specified address.'],
  ['', 'has-car', 'Filter only stations with available car.'],
  ['', 'reserve', 'Reserve a car at specified station.'],
  ['', 'cancel', 'Cancel a reservation.'],
  ['', 'reservation=ARG', 'Specify a reservation id.'],
  ['', 'station=ARG', 'Specify a station id.'],
  ['', 'start=ARG', 'Filter with start date (US format: mm/dd/yyyy).'],
  ['', 'end=ARG', 'Filter with end date (US format: mm/dd/yyyy).'],
  ['', 'mail=ARG', 'Mail a preconfigured status.'],
  ['', 'mail-to=ARG', 'Mail to specific address.'],
  ['', 'mail-transport=ARG', 'Specify a preconfigured mail transport.'],
  ['', 'mail-user=ARG', 'Specify SMTP auth username.'],
  ['', 'mail-pass=ARG', 'Specify SMTP auth password.'],
  ['', 'service', 'Instianciate a website controller.'],
  ['d', 'debug', 'Activate debug mode.'],
  ['', 'help', 'Display this help']
]).bindHelp();
var opt = getopt.parseSystem();

if (opt.options.service) {
  require('../src/service').run({
    debug: opt.options.debug
  });
} else if (!opt.options.username || !opt.options.password) {
  console.error('Missing username and password.');
  getopt.showHelp();
} else {

  if (opt.options.mail) {
    var mailOptions = {
      transport: {
        service: opt.options['mail-transport'],
        auth: {
          user: opt.options['mail-user'],
          pass: opt.options['mail-pass']
        }
      }
    };
  }

  var session = new Session(opt.options.debug);

  session.login(opt.options.username, opt.options.password).then(function() {
    if (opt.options.mail && opt.options.mail.toLowerCase() == 'usage') {
      opt.options.debug && console.log('SWITCH mail usage.');

      var prevRange = utils.createRange('last-month');
      var curRange = utils.createRange('current-month');
      var prevRentals = session.rentals(prevRange.start, prevRange.end);
      var curRentals = session.rentals(curRange.start, curRange.end);

      Q.all([prevRentals, curRentals]).spread(function(lastRentals, rentals) {
        var usage = Math.round(100 * rentals.reduce(function(prev, cur) {
          return prev + cur.amount;
        }, 0)) / 100;
        opt.options.debug && console.log('Usage:', usage);

        var lastUsage = Math.round(100 * lastRentals.reduce(function(prev, cur) {
          return prev + cur.amount;
        }, 0)) / 100;
        opt.options.debug && console.log('Last usage:', lastUsage);


        mailOptions.mail = {
          from: opt.options['mail-to'],
          to: opt.options['mail-to'],
          subject: 'Autolib Usage',
          html: '<p>Current month usage: <strong>' + usage + ' €</strong></p>' +
            '<p>Last month usage: ' + lastUsage + '</p>'
        };

        utils.mail(mailOptions).then(function() {
          console.log('Mail sent.');
        }).catch(function(err) {
          console.error('Failed to send mail.', err);
        })
      });
    } else if (opt.options.info) {
      opt.options.debug && console.log('SWITCH info.');

      session.info().then(function(userInfo) {
        console.log(userInfo);
      });
    } else if (opt.options.rentals) {
      opt.options.debug && console.log('SWITCH rentals.');

      session.rentals(opt.options.start, opt.options.end).then(function(rentals) {
        console.log(rentals);
      });
    } else if (opt.options.bills) {
      opt.options.debug && console.log('SWITCH bills.');

      session.bills(opt.options.start, opt.options.end).then(function(bills) {
        console.log(bills);
      });
    } else if (opt.options.bill) {
      opt.options.debug && console.log('SWITCH bill.');

      session.bill(opt.options.bill).then(function(bill) {
        console.log(bill);
      });
    } else if (opt.options.near) {
      opt.options.debug && console.log('SWITCH near.');

      session.near(opt.options.near).then(function(stations) {
        if (opt.options['has-car']) {
          stations = stations.filter(function(s) {
            return s.available > 0;
          });
        }
        console.log(stations);
      });
    } else if (opt.options.reserve && opt.options.station) {
      opt.options.debug && console.log('SWITCH reserve.');

      session.reserve(opt.options.station).then(function(status) {
        console.log(status);
      });
    } else if (opt.options.cancel && opt.options.reservation) {
      opt.options.debug && console.log('SWITCH cancel.');

      session.cancel(opt.options.reservation).then(function(status) {
        console.log(status);
      });
    } else {
      getopt.showHelp();
    }

  });
}
