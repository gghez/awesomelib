angular.module('awesomelib').controller('homeController', [
  '$scope', 'usage', '$window', '$location', 'stations', 'car',
  function($scope, usage, $window, $location, stations, car) {

    $scope.Math = $window.Math;

    function load() {
      usage.get().then(function(u) {
        $scope.usage = u;
        $scope.usage.diff = u.cur - u.prev;
      }).catch(function() {
        $location.path('/login');
      });

      stations.shortcuts().then(function(stations) {
        $scope.shortcuts = stations;
      });
    }

    load();

    $scope.reserve = function(type, hrid){
      car.reserve(type, hrid).then(function(){
        $location.path('/pending/' + type);
      });
    };

  }
]);
