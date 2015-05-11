angular.module('awesomelib').service('subscription', [
  '$http',
  function($http) {
    return {
      get: function() {
        return $http.get('/api/v2/subscription').then(function(resp) {
          return resp.data.results;
        });
      }
    };
  }
]);
