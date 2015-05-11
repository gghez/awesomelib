angular.module('awesomelib').controller('rentalsController', [
    '$scope', 'rentals',
    function ($scope, rentals) {

        function load() {
            rentals.get().then(function (history) {
                var now = new Date();

                $scope.rentals = history.filter(function (rental) {
                    var start = new Date(rental.start);
                    return start.getYear() == now.getYear() && start.getMonth() == now.getMonth();
                });

            });
        }

        load();

    }
]);
