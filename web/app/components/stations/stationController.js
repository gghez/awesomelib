angular.module('awesomelib').controller('stationController', [
    '$scope', 'stations', '$routeParams', 'reservation', '$interval',
    function ($scope, stations, $routeParams, reservation, $interval) {

        var countStop = null;

        function startCountDown(res) {
            countStop && $interval.cancel(countStop);
            var countDown = res.seconds_before_expiration;

            function update() {
                var hours = Math.floor(--countDown / 3600);
                var minutes = Math.floor((countDown % 3600) / 60);
                var seconds = countDown % 60;

                res.countDown = (hours < 10 ? '0' : '') + hours + ':' +
                    (minutes < 10 ? '0' : '') + minutes + ':' +
                    (seconds < 10 ? '0' : '') + seconds;
            }

            countStop = $interval(update, 1000);
        }

        function load() {
            stations.get($routeParams.stationId).then(function (stations) {
                $scope.station = stations[0];

                $scope.station.full_address = [$scope.station.address, $scope.station.city].join(', ');

                reservation.pending().then(function (reservations) {
                    if (!reservations.some(function (r) {
                            if (r.station == $scope.station.id && r.status == 'PENDING') {
                                $scope.res = r;
                                startCountDown(r);
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

        $scope.cancel = function (kind, reservationId) {
            var type = kind.replace('reservation', '');
            reservation.cancel(type, reservationId).then(load);
        };
    }
]);
