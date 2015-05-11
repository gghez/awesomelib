var http = require('./http-helper');

module.exports = function(username, password) {
  return http.post('/oauth2/token/', {
    username: username,
    password: password,
    grant_type: 'password'
  }, {
    'Authorization': 'Basic xxxxx==',
    'Content-Type': 'application/x-www-form-urlencoded'
  });
};
