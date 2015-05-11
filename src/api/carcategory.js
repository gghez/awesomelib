var http = require('./http-helper');

module.exports = function(token) {
  return http.get('/v2/carcategory/', {
    'Authorization': 'Bearer ' + token
  });
};
