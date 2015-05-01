var login = require('./login');
var info = require('./info');
var utils = require('./utils');
var rentals = require('./rentals');
var bills = require('./bills');

function Session() {
  this.cookies = null;
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
  return login(username, password).then(function(cookies) {
    _this.cookies = cookies;
  });
};

Session.prototype.info = function() {
  var _this = this;
  return info(this.cookies).catch(function(err) {
    _this.errorHandler(err);
  });
};

Session.prototype.rentals = function(start, end) {
  var _this = this;
  return rentals(start, end, this.cookies).catch(function(err) {
    _this.errorHandler(err);
  });
};

Session.prototype.bills = function(start, end) {
  var _this = this;
  return bills.filter(start, end, this.cookies).catch(function(err) {
    _this.errorHandler(err);
  });
};

Session.prototype.bill = function(number) {
  var _this = this;
  return bills.download(number, this.cookies).catch(function(err) {
    _this.errorHandler(err);
  });
};

module.exports = Session;
