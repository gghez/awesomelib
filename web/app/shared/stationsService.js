angular.module('awesomelib').service('stations', ['$http', function($http) {
  return {
    all: function() {
      return $http.get('/api/v2/station').then(function(resp) {
        console.debug && console.debug('[HTTP] Stations ->', resp.data.results.length);
        return resp.data.results;
      });
    },
    get: function(stationId) {
      return $http.get('/api/v2/station/' + encodeURIComponent(stationId)).then(function(resp) {
        console.debug && console.debug('[HTTP] Stations ->', resp.data.results.length);
        return resp.data.results;
      });
    }
  };
}]);
