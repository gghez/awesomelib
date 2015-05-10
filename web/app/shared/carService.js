angular.module('awesomelib').service('car', ['$http', function($http) {
  return {
    pending: function() {
      return $http.get('/rest/car/pending').then(function(resp) {
        return resp.data;
      });
    }
  };
}]);
