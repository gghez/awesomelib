angular.module('awesomelib').controller('pendingController', [
    '$interval', '$scope', 'reservation', 'stations', '$routeParams', '$anchorScroll', '$location',
    function ($interval, $scope, reservation, stations, $routeParams, $anchorScroll, $location) {

        var timers = [];

        function startCountDown(res) {
            timers.forEach(function (t) {
                $interval.cancel(t);
            });
            timers.length = 0;

            var countDown = res.seconds_before_expiration;

            function update() {
                var hours = Math.floor(--countDown / 3600);
                var minutes = Math.floor((countDown % 3600) / 60);
                var seconds = countDown % 60;

                res.countDown = (hours < 10 ? '0' : '') + hours + ':' +
                    (minutes < 10 ? '0' : '') + minutes + ':' +
                    (seconds < 10 ? '0' : '') + seconds;
            }

            timers.push($interval(update, 1000));
        }

        function load() {
            timers.forEach(function (t) {
                $interval.cancel(t);
            });
            timers.length = 0;

            reservation.pending().then(function (reservations) {
                $scope.reservations = reservations;

                $scope.reservations.forEach(function (res) {
                    stations.get(res.station).then(function (stations) {
                        res.station = stations[0];
                    });

                    if (res.status == 'PENDING') {
                        startCountDown(res);
                    }
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
