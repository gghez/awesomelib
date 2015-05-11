angular.module('awesomelib').service('login', [
  '$http',
  function($http) {
    return {
      authenticate: function(username, password) {
        return $http.post('/api/v2/oauth2', {
          username: username,
          password: password
        });
      }
    };
  }
]);
