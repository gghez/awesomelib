angular.module('awesomelib').controller('stationsController', [
    '$scope', 'stations', '$location', 'reservation', 'geoloc', 'Loader', 'info', '$routeParams',
    function ($scope, stations, $location, reservation, geoloc, Loader, info) {

        function load() {
            Loader.start('stations');

            geoloc.me().then(function (me) { // try current GPS location
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
            }).then(function (pos) { // Select nearest stations from reference position
                return /favourite/.test($location.path()) ? stations.favourite().then(function (_stations) {
                    return _stations.map(function (s) {
                        return (s.distance = Math.round(0.01 * geoloc.distance(s, pos)) / 10) && s;
                    });
                }) : stations.near(pos);
            }).then(function (_stations) {
                $scope.stations = _stations;
            }).finally(function () {
                Loader.stop('stations');
            });
        }

        load();



    }
]);
