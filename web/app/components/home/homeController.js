angular.module('awesomelib').controller('homeController', [
    '$scope', 'rentals', '$window', '$location', 'geoloc', 'info', 'stations', 'Loader', '$q',
    function ($scope, rentals, $window, $location, geoloc, info, stations, Loader, $q) {

        var me=null;

        function nearest(type) {
            return geoloc.me().then(function (_me) {
                me = _me;
                return stations.near(_me, function (s) {
                    return (type == 'car' ? s.cars : s.parks) > 0;
                });
            }).then(function (_stations) {
                $scope.stations = _stations;
                $scope.nearest = _stations[0];
            });
        }

        function load() {
            Loader.start('home');

            var rentalsLoad = rentals.get().then(function (history) {
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


            var nearestLoad = nearest('car');

            $q.all([rentalsLoad, nearestLoad]).finally(function () {
                Loader.stop('home');
                $scope.initialPosition = me;
            });
        }

        load();


    }
]);
