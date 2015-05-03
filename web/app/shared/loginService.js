angular.module('awesomelib').service('login', ['$http', '$cookies', function($http, $cookies) {
  return {
    authenticate: function(username, password) {
      return $http.post('/rest/auth/', {
        username: username,
        password: password
      }).then(function(resp) {
        var token = resp.data.token;
        $cookies['AL-TOKEN'] = token;
      });
    }
  };
}]);
