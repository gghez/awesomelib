angular.module('awesomelib').service('usage', ['$http', function($http) {
  return {
    get: function() {
      return $http.get('/rest/usage').then(function(resp) {
        return resp.data;
      });
    }
  };
}]);
