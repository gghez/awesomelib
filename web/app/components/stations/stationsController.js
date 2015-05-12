angular.module('awesomelib').controller('stationsController', [
    '$scope', 'stations', '$location', 'reservation', 'geoloc', 'Loader', 'info',
    function ($scope, stations, $location, reservation, geoloc, Loader, info) {


        function load() {
            Loader.start('stations');

            var _stations;

            stations.all().then(function (stations) {
                _stations = stations;
            }).then(function () { // Determine reference position
                return geoloc.me().then(function (me) { // try current GPS location
                    me.lat = me.coords.latitude;
                    me.lng = me.coords.longitude;

                    return geoloc.addressOf(me).then(function (address) {
                        $scope.currentAddress = address;
                        return me;
                    });
                }).catch(function (err) { // Else try customer home location
                    console.warn('geoloc failed, use customer home.', err);

                    return info.get().then(function (ci) {
                        $scope.currentAddress = [ci.address.street, ci.address.zipcode, ci.address.city].join(', ');
                        return geoloc.coordOf($scope.currentAddress);
                    });
                });
            }).then(function (pos) { // Select nearest stations from reference position
                console.debug && console.debug('Reference position', pos);
                _stations.forEach(function (s) {
                    s.distance = Math.round(0.01 * geoloc.distance(s, pos)) / 10;
                });

                _stations.sort(function (s1, s2) {
                    return s1.distance < s2.distance ? -1 : 1;
                });

                $scope.stations = _stations.slice(0, 10);
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
