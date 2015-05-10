angular.module('awesomelib').controller('pendingController', [
  '$scope', 'car',
  function($scope, car) {

    car.pending().then(function(reservations) {
      $scope.reservations = reservations;
    });

    $scope.cancel = function() {
      $window.alert('Not implemented yet.');
    };
  }
]);
