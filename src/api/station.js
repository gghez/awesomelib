var http = require('./http-helper');
var querystring = require('querystring');

module.exports = function(ids, token) {
  if (typeof ids == 'string') {
    ids = ids.split(',');
  }

  var idQuery = ids.filter(function(id){
    return !!id;
  }).map(function(id) {
    return 'id=' + encodeURIComponent(id)
  }).join('&');

  idQuery && (idQuery = '?' + idQuery);

  return http.get('/v2/station/' + idQuery, {
    'Authorization': 'Bearer ' + token
  });
};
