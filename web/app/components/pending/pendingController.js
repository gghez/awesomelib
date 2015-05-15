angular.module('awesomelib').controller('pendingController', [
    '$interval', '$scope', 'reservation', 'stations', 'Loader', '$location',
    function ($interval, $scope, reservation, stations, Loader, $location) {

        function load() {
            Loader.start('pending');

            reservation.pending().then(function (reservations) {
                $scope.reservations = reservations;

                $scope.reservations.forEach(function (res) {
                    stations.get(res.station).then(function (stations) {
                        res.station = stations[0];
                    });
                });

            }).catch(function (err) {
                if (err.status == 401) {
                    $location.path('/login');
                }
            }).finally(function () {
                Loader.stop('pending');
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
