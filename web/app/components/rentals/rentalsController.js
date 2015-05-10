angular.module('awesomelib').controller('rentalsController', [
  '$scope', 'rentals', 'stations',
  function($scope, rentals, stations) {

    stations.all().then(function(stations) {

      rentals.get().then(function(rentals) {
        $scope.rentals = rentals;

        $scope.rentals.forEach(function(rental) {

          stations.some(function(s) {
            if (typeof rental.from == 'string' && s.address.toLowerCase() == rental.from.toLowerCase()) {
              rental.from = s;
            } else if (typeof rental.to == 'string' && s.address.toLowerCase() == rental.to.toLowerCase()) {
              rental.to = s;
            }

            if (typeof rental.from == 'object' && typeof rental.to == 'object') {
              return true;
            }

          });

          if (typeof rental.from == 'string') rental.from = {
            address: rental.from
          };
          if (typeof rental.to == 'string') rental.to = {
            address: rental.to
          };


        });

      });

    });



  }
]);
