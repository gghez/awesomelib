angular.module('awesomelib').service('stations', ['$http', function($http) {
  return {
    near: function(type, address) {
      return $http.get('/rest/stations/near/' + type + '/' + address).then(function(resp) {
        return resp.data;
      });
    },
    all: function() {
      return $http.get('/rest/stations/').then(function(resp) {
        return resp.data;
      });
    },
    get: function(stationId) {
      return $http.get('/rest/stations/' + stationId).then(function(resp) {
        return resp.data;
      });
    },
    address: function(address) {
      return $http.get('/rest/stations/address/' + address).then(function(resp) {
        return resp.data;
      });
    }
  };
}]);
