var Q = require('q');
var nodemailer = require('nodemailer');

module.exports.cookiesContainer = function(headerCookies) {
  if (typeof headerCookies == 'string'){
    headerCookies = headerCookies.split(';');
  }

  return (headerCookies || []).reduce(function(prev, cur) {
    var cParts = cur.split('=');
    var name = cParts[0].trim();
    var value = cParts[1].split(';')[0].trim();
    prev[name] = value;
    return prev;
  }, {});
};

module.exports.stringifyCookies = function(cookies) {
  return Object.keys(cookies).map(function(name) {
    return name + '=' + cookies[name];
  }).join('; ');
};

module.exports.respBody = function(res) {
  var defer = Q.defer();

  var data = [];
  res.on('data', function(chunk) {
    data.push(chunk);
  });
  res.on('end', function() {
    defer.resolve(Buffer.concat(data));
  });

  return defer.promise;
};

module.exports.setTimeout = function(req, timeout) {
  req.on('socket', function(socket) {
    socket.on('timeout', function() {
      req.abort();
    });
    socket.setTimeout(timeout);
  });
};

module.exports.mail = function(options) {
  var transporter = nodemailer.createTransport(options.transport);
  var options = options.mail;

  return Q.nbind(transporter.sendMail, transporter)(options);
};

module.exports.createRange = function(period) {
  var range = {};
  switch (period) {
    case 'current-month':
      var now = new Date();
      range.start = (now.getMonth() + 1) + '/01/' + now.getFullYear();
      var d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      range.end = (now.getMonth() + 1) + '/' + d.getDate() + '/' + now.getFullYear();
      break;
    case 'last-month':
      var now = new Date();
      range.start = now.getMonth() + '/01/' + now.getFullYear();
      var d = new Date(now.getFullYear(), now.getMonth(), 0);
      range.end = now.getMonth() + '/' + d.getDate() + '/' + now.getFullYear();
      break;
  }

  return range;
};
