angular.module('awesomelib').controller('stationController', [
    '$scope', 'stations', '$routeParams', 'reservation', '$interval',
    function ($scope, stations, $routeParams, reservation, $interval) {

        function load() {
            stations.get($routeParams.stationId).then(function (stations) {
                $scope.station = stations[0];

                reservation.pending().then(function (reservations) {
                    if (!reservations.some(function (r) {
                            if (r.station == $scope.station.id && r.status == 'PENDING') {
                                $scope.res = r;
                                return true;
                            }
                        })) {
                        $scope.res = null;
                    }
                });
            });
        }

        load();

        $scope.reserve = function (type, stationId) {
            reservation.reserve(type, stationId).then(load);
        };

        $scope.cancel = function () {
            var type = $scope.res.kind.replace('reservation', '');
            reservation.cancel(type, $scope.res.reservation_id).then(load);
        };
    }
]);
