var Q = require('q');

module.exports.cookiesContainer = function(headerCookies) {
  return headerCookies.reduce(function(prev, cur) {
    var cParts = cur.split('=');
    var name = cParts[0].trim();
    var value = cParts[1].split(';')[0].trim();
    prev[name] = value;
    return prev;
  }, {});
};

module.exports.stringifyCookies = function(cookies) {
  return Object.keys(cookies).map(function(name){
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
