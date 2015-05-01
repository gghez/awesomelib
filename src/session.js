var login = require('./login');
var info = require('./info');
var utils = require('./utils');
var rentals = require('./rentals');
var bills = require('./bills');

function Session(debug) {
  this.cookies = null;
  this.debug = debug;
  this.errorHandler = function(err) {
    console.error(err);
    process.kill(process.pid);
  }
}

Session.prototype.error = function(callback) {
  this.errorHandler = callback;
}

Session.prototype.login = function(username, password) {
  var _this = this;
  return login({
    username: username,
    password: password,
    debug: this.debug
  }).then(function(cookies) {
    _this.cookies = cookies;
  }).catch(this.errorHandler.bind(this));
};

Session.prototype.info = function() {
  return info({
    cookies: this.cookies,
    debug: this.debug
  }).catch(this.errorHandler.bind(this));
};

Session.prototype.rentals = function(start, end) {
  return rentals({
      start: start,
      end: end,
      cookies: this.cookies,
      debug: this.debug
    })
    .catch(this.errorHandler.bind(this));
};

Session.prototype.bills = function(start, end) {
  return bills.filter({
      start: start,
      end: end,
      cookies: this.cookies,
      debug: this.debug
    })
    .catch(this.errorHandler.bind(this));
};

Session.prototype.bill = function(number) {
  return bills.download({
      number: number,
      cookies: this.cookies,
      debug: this.debug
    })
    .catch(this.errorHandler.bind(this));
};

module.exports = Session;
