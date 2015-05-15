angular.module('awesomelib').controller('homeController', [
    '$scope', 'rentals', '$window', '$location', 'geoloc', 'info', 'stations', 'Loader', '$q',
    function ($scope, rentals, $window, $location, geoloc, info, stations, Loader, $q) {

        var me = null;

        function loadRentalsSummary() {
            return rentals.get().then(function (history) {
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
            });
        }

        function loadMap() {
            var defer = $q.defer();

            var watchId = geoloc.watchMe(function (_me) {
                me = _me;
                stations.near(_me, function (s) {
                    return s.cars > 0;
                }).then(function (_stations) {
                    $scope.stations = _stations;
                    $scope.nearest = _stations[0];
                    defer.resolve();
                });
            });

            $scope.$on('$destroy', function () {
                geoloc.unwatch(watchId);
            });

            return defer.promise;
        }


        Loader.start('home');

        var rentalsSummary = loadRentalsSummary();
        var mapInit = loadMap();

        $q.all([rentalsSummary, mapInit]).catch(function (err) {
            if (err.status == 401) {
                $location.path('/login');
            }
        }).finally(function () {
            Loader.stop('home');
            $scope.initialPosition = me;
        });


    }
]);
