angular.module('awesomelib').controller('rentalsController', [
    '$scope', 'rentals', 'Loader', '$location',
    function ($scope, rentals, Loader, $location) {

        function load() {
            Loader.start('rentals');

            rentals.get().then(function (history) {
                var now = new Date();

                $scope.rentals = history.filter(function (rental) {
                    var start = new Date(rental.start);
                    return start.getYear() == now.getYear() && start.getMonth() == now.getMonth();
                });

            }).catch(function (err) {
                if (err.status == 401) {
                    $location.path('/login');
                }
            }).finally(function () {
                Loader.stop('rentals');
            });
        }

        load();

    }
]);
