angular.module('awesomelib').controller('stationsController', [
    '$scope', 'stations', '$location', 'reservation', 'geoloc', 'Loader', 'info',
    function ($scope, stations, $location, reservation, geoloc, Loader, info) {

        function load() {
            Loader.start('stations');

            geoloc.me().then(function (me) { // try current GPS location
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
            }).then(function (pos) { // Select nearest stations from reference position
                return stations.near(pos);
            }).then(function (stations) {
                $scope.stations = stations;
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
