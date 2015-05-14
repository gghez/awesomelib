angular.module('awesomelib').controller('pendingController', [
    '$interval', '$scope', 'reservation', 'stations',
    function ($interval, $scope, reservation, stations) {

        function load() {

            reservation.pending().then(function (reservations) {
                $scope.reservations = reservations;

                $scope.reservations.forEach(function (res) {
                    stations.get(res.station).then(function (stations) {
                        res.station = stations[0];
                    });
                });

            });
        }

        load();

        $scope.cancel = function (type, reservationId) {
            reservation.cancel(type, reservationId).then(load);
        };

        $scope.reserve = function (type, stationId) {
            return reservation.reserve(type, stationId).then(load);
        };
    }
]);
