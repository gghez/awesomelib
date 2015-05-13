angular.module('awesomelib').controller('homeController', [
    '$scope', 'rentals', '$window', '$location', 'geoloc', 'info',
    function ($scope, rentals, $window, $location, geoloc, info) {

        function load() {
            rentals.get().then(function (history) {
                var now = new Date();
                var prev = new Date(now);
                prev.setDate(0);

                $scope.usage = {
                    cur: history.filter(function (rental) {
                        var start = new Date(rental.start);
                        return start.getYear() == now.getYear() && start.getMonth() == now.getMonth();
                    }).reduce(function (sum, rental) {
                        return sum + rental.net_amount;
                    }, 0) / 100,
                    prev: history.filter(function (rental) {
                        var start = new Date(rental.start);
                        return start.getYear() == prev.getYear() && start.getMonth() == prev.getMonth();
                    }).reduce(function (sum, rental) {
                        return sum + rental.net_amount;
                    }, 0) / 100
                };

                $scope.usage.diff = $scope.usage.cur - $scope.usage.prev;
            });

            info.get().then(function (ci) {
                return geoloc.coordOf([ci.address.street, ci.address.zipcode, ci.address.city].join(', '));
            }).then(function (latlng) {
                $scope.initialPosition = latlng;
            });
        }

        load();

        $scope.reserve = function (type, stationId) {
            car.reserve(type, stationId).then(function () {
                $location.path('/pending/' + type);
            });
        };

    }
]);
