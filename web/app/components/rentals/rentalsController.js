angular.module('awesomelib').controller('rentalsController', ['$scope', 'rentals', function($scope, rentals) {

  rentals.get().then(function(rentals) {
    $scope.rentals = rentals;
  });

}]);
