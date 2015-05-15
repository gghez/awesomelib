angular.module('awesomelib').controller('stationController', [
    '$scope', 'stations', '$routeParams', 'reservation', '$interval', '$location', 'Loader',
    function($scope, stations, $routeParams, reservation, $interval, $location, Loader) {

        function load() {
            Loader.start('station');

            stations.get($routeParams.stationId).then(function(stations) {
                $scope.stations = stations;
                $scope.station = stations[0];

                reservation.pending().then(function(reservations) {
                    if (!reservations.some(function(r) {
                            if (r.station == $scope.station.id && r.status == 'PENDING') {
                                $scope.res = r;
                                return true;
                            }
                        })) {
                        $scope.res = null;
                    }
                });
            }).catch(function(err) {
                if (err.status == 401) {
                    $location.path('/login');
                }
            }).finally(function() {
                Loader.stop('station');
            });
        }

        load();

        $scope.reserve = function(type, stationId) {
            reservation.reserve(type, stationId).then(load);
        };

        $scope.cancel = function() {
            var type = $scope.res.kind.replace('reservation', '');
            reservation.cancel(type, $scope.res.reservation_id).then(load);
        };
    }
]);
