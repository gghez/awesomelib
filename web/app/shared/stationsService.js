angular.module('awesomelib').service('stations', ['$http', function($http) {
  return {
    near: function(type, address) {
      console.debug && console.debug('[HTTP] Near', type, address);
      return $http.get('/rest/stations/near/' + encodeURIComponent(type) + '/' + encodeURIComponent(address)).then(function(resp) {
        console.debug && console.debug('[HTTP] Near ->', resp.data.length);
        return resp.data;
      });
    },
    all: function() {
      console.debug && console.debug('[HTTP] All stations');
      return $http.get('/rest/stations/').then(function(resp) {
        console.debug && console.debug('[HTTP] All stations ->', resp.data.length);
        return resp.data;
      });
    },
    get: function(stationId) {
      console.debug && console.debug('[HTTP] Station', stationId);
      return $http.get('/rest/stations/' + encodeURIComponent(stationId)).then(function(resp) {
        console.debug && console.debug('[HTTP] Station ->', resp.data);
        return resp.data;
      });
    },
    address: function(address) {
      console.debug && console.debug('[HTTP] Address', address);
      return $http.get('/rest/stations/address/' + encodeURIComponent(address)).then(function(resp) {
        console.debug && console.debug('[HTTP] Address ->', resp.data.length);
        return resp.data;
      });
    }
  };
}]);
