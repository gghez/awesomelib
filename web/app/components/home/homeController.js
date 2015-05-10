angular.module('awesomelib').controller('homeController', [
  '$scope', 'usage', '$window', '$location', 'car',
  function($scope, usage, $window, $location, car) {

    $scope.Math = $window.Math;

    usage.get().then(function(u) {
      $scope.usage = u;
      $scope.usage.diff = u.cur - u.prev;
    }).catch(function() {
      $location.path('/login');
    });

    car.pending().then(function(reservations) {
      $scope.reservations = reservations;
    });

    $scope.cancel = function() {
      $window.alert('Not implemented yet.');
    };
  }
]);
