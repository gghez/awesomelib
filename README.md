# Web application for autolib'

This is a set of CLI commands allowing to retrieve information from you personal account to display them in a meaningful JSON format.

## Installation

```
npm install -g autolib
```

Then create security file `./src/api/oauth2.js` using your own (replace `<long_base64_token>`) oauth2 initialization token:

```
var http = require('./http-helper');

module.exports = function(username, password) {
  return http.post('/oauth2/token/', {
    username: username,
    password: password,
    grant_type: 'password'
  }, {
    'Authorization': 'Basic <long_base64_token>',
    'Content-Type': 'application/x-www-form-urlencoded'
  });
};
```

*PS: Will be replaced by a configuration file as soon as possible.*

## Examples

### Run as web application

Use PORT env variable or default port 3788.

```
autolib --service
```

Web application available at: `http://localhost:3788/`
