angular.module('awesomelib').service('rentals', ['$http', function($http) {
  return {
    get: function() {
      return $http.get('/rest/rentals').then(function(resp) {
        return resp.data;
      });
    }
  };
}]);
