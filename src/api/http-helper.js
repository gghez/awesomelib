var https = require('https');
var Q = require('q');
var querystring = require('querystring');

module.exports.request = function(method, path, data, additionalHeaders) {
  var defer = Q.defer();

  var postData = data ?
    (/urlencoded/i.test(additionalHeaders['Content-Type']) ?
      querystring.stringify(data) : JSON.stringify(data)) : '';

  var headers = {
    'X-AppIdentifier': 'eu.autolib.publiciosapp',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'X-AppVersion': 5164,
    'Accept-Language': 'fr-fr',
    'User-Agent': 'Autolib/5164 CFNetwork/672.1.15 Darwin/14.0.0',
    'Content-Type': 'application/json'
  };

  if (postData) {
    headers['Content-Length'] = postData.length;
  } else if (method == 'DELETE') {
    headers['Content-Length'] = 0;
  }

  for (var header in additionalHeaders) {
    headers[header] = additionalHeaders[header];
  }

  var req = https.request({
    method: method,
    host: 'api.autolib.eu',
    path: path,
    headers: headers
  });

  req.on('response', function(res) {
    if (res.statusCode == 204) {
      defer.resolve();
    } else if (res.statusCode >= 200 && res.statusCode < 400) {
      var data = [];
      res.on('data', function(chunk) {
        data.push(chunk);
      });
      res.on('end', function() {
        try {
          var buffer = Buffer.concat(data);
          var json = buffer.toString();
          var obj = JSON.parse(json);

          defer.resolve(obj);
        } catch (ex) {
          defer.reject(ex);
        }
      });
    } else {
      defer.reject('HTTP Status ' + res.statusCode);
    }
  });

  req.on('error', function(err) {
    defer.reject(err);
  });

  postData && req.write(postData);

  req.end();

  return defer.promise.catch(function(err) {
    console.error('Method was', method);
    console.error('Path was', path);
    console.error('Headers was', headers);
    postData && console.error('Post data was', postData);
    throw err;
  });
};

module.exports.get = function(path, additionalHeaders) {
  return module.exports.request('GET', path, null, additionalHeaders);
};

module.exports.delete = function(path, additionalHeaders) {
  return module.exports.request('DELETE', path, null, additionalHeaders);
};

module.exports.post = function(path, data, additionalHeaders) {
  return module.exports.request('POST', path, data, additionalHeaders);
};
