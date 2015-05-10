angular.module('awesomelib').service('stations', ['$http', function($http) {
  return {
    near: function(address) {
      return $http.get('/rest/stations/near/' + address).then(function(resp) {
        return resp.data;
      });
    }
  };
}]);
