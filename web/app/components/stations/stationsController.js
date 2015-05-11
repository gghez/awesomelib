angular.module('awesomelib').controller('stationsController', [
    '$scope', 'stations', '$location', 'reservation', 'geoloc', 'Loader',
    function ($scope, stations, $location, reservation, geoloc, Loader) {

        $scope.Math = Math;

        function load() {
            Loader.start('stations');

            var _stations;
            stations.all().then(function (stations) {
                _stations = stations;
                return geoloc.me();
            }).then(function (me) {
                me.lat = me.coords.latitude;
                me.lng = me.coords.longitude;

                _stations.forEach(function (s) {
                    s.distance = Math.round(0.01 * geoloc.distance(s, me)) / 10;
                });

                _stations.sort(function (s1, s2) {
                    return s1.distance < s2.distance ? -1 : 1;
                });

                $scope.stations = _stations.slice(0, 10);

                return geoloc.addressOf(me);
            }).then(function (address) {
                $scope.currentAddress = address;
            }).finally(function () {
                Loader.stop('stations');
            });
        }

        load();

        $scope.reserve = function (type, stationId) {
            reservation.reserve(type, stationId).then(function () {
                $location.path('/pending/' + type);
            });
        };

    }
]);
