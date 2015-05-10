var login = require('./login');
var info = require('./info');
var utils = require('./utils');
var rentals = require('./rentals');
var bills = require('./bills');
var stations = require('./stations');
var car = require('./car');

function Session(debug) {
  this.cookies = null;
  this.debug = debug;
  this.errorHandler = function(err) {
    console.error(err instanceof Error ? err.stack : err);
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

Session.prototype.near = function(address) {
  return stations.near({
      type: 'car',
      address: address,
      cookies: this.cookies,
      debug: this.debug
    })
    .catch(this.errorHandler.bind(this));
};

Session.prototype.stations = function() {
  return stations.all({
      cookies: this.cookies,
      debug: this.debug
    })
    .catch(this.errorHandler.bind(this));
};

Session.prototype.reserve = function(type, stationId) {
  return car.reserve({
      type: type,
      stationId: stationId,
      cookies: this.cookies,
      debug: this.debug
    })
    .catch(this.errorHandler.bind(this));
};

Session.prototype.cancel = function(type, reservationId) {
  return car.cancel({
      type: type,
      reservationId: reservationId,
      cookies: this.cookies,
      debug: this.debug
    })
    .catch(this.errorHandler.bind(this));
};

Session.prototype.pending = function() {
  return car.pending({
      cookies: this.cookies,
      debug: this.debug
    })
    .catch(this.errorHandler.bind(this));
};

module.exports = Session;
