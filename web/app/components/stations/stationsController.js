angular.module('awesomelib').controller('stationsController', [
    '$scope', 'stations', '$location', 'reservation', 'geoloc', 'Loader', 'info', '$routeParams',
    function($scope, stations, $location, reservation, geoloc, Loader, info) {

        var _stations = null;
        var _reservations = null;

        $scope.favourite = /favourite/.test($location.path());

        function load() {
            Loader.start('stations');

            geoloc.me().catch(function(err) {
                console.warn('Cannot retrieve geolocation.', err);
                return null;
            }).then(function(pos) {
                if ($scope.favourite) {
                    return stations.favourite().then(function(favourites) {
                        return pos ? stations.sortedFrom(favourites, pos) : favourites;
                    });
                } else if (pos) {
                    return reservation.pending().then(function(reservations) {
                        _reservations = reservations;
                        return stations.near(pos);
                    });
                } else {
                    return [];
                }
            }).then(function(filteredStations) {
                _stations = filteredStations;
            }).catch(function(err) {
                if (err.status == 401) {
                    $location.path('/login');
                }
            }).finally(function() {
                $scope.filterStations('car');
                Loader.stop('stations');
            });
        }

        $scope.filterStations = function(type) {
            $scope.type = type;
            $scope.stations = _stations && _stations.filter(function(s) {
                return (s.cars > 0 && type == 'car') ||
                    (s.slots > 0 && type == 'park') || (_reservations && _reservations.some(function(r) {
                        return r.station == s.id && r.status == 'PENDING';
                    }));
            });
        };

        load();
    }
]);
