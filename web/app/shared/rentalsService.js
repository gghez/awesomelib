angular.module('awesomelib').service('rentals', ['$http', function($http) {
  return {
    get: function() {
      return $http.get('/api/v2/rentalshistory').then(function(resp) {
        console.debug && console.debug('[HTTP] Rentals ->', resp.data.results.length);
        return resp.data.results;
      });
    }
  };
}]);
