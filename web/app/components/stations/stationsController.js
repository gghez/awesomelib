angular.module('awesomelib').controller('stationsController', [
    '$scope', 'stations', '$location', 'reservation', 'geoloc', 'Loader', 'info', '$routeParams',
    function ($scope, stations, $location, reservation, geoloc, Loader, info) {

        $scope.favourite = /favourite/.test($location.path());


        function load() {
            Loader.start('stations');


            geoloc.me().then(function (me) {
                return geoloc.addressOf(me).then(function (address) {
                    $scope.currentAddress = address;
                    return me;
                });
            }).catch(function () {
                return null;
            }).then(function (pos) {
                if ($scope.favourite) {
                    return stations.favourite().then(function (_stations) {
                        if (pos) {
                            _stations.forEach(function (s) {
                                s.distance = Math.round(0.01 * geoloc.distance(s, pos)) / 10;
                            });

                            _stations.sort(function (s1, s2) {
                                return s1.distance < s2.distance ? -1 : 1;
                            });
                        }

                        return _stations;
                    });
                } else if (pos) {
                    return reservation.pending().then(function(reservations){
                        return stations.near(pos, function (s) {
                            return s.cars > 0 || reservations.some(function(r){
                                    return r.station == s.id && r.status == 'PENDING';
                                });
                        });
                    });
                } else {
                    return [];
                }
            }).then(function (_stations) {
                $scope.stations = _stations;
            }).catch(function (err) {
                if (err.status == 401) {
                    $location.path('/login');
                }
            }).finally(function () {
                Loader.stop('stations');
            });
        }

        load();


    }
]);
