angular.module('awesomelib').directive('alMap', [
    'stations', '$q', 'geoloc', '$location',
    function (stations, $q, geoloc, $location) {

        var markerMe = null;

        function displayMe(map, latlng) {
            if (markerMe) markerMe.setMap(null);

            markerMe = new google.maps.Marker({
                position: latlng,
                map: map,
                title: "You are here!",
                icon: 'assets/img/blue-circle-10.png'
            });
        }

        return {
            restrict: 'E',
            template: '<div class="al-map"></div>',
            replace: true,
            scope: {
                centerOn: '=',
                followMe: '=',
                zoom: '=',
                stations: '=',
                meTo: '='
            },
            link: function (scope, element, attrs) {

                var map = new google.maps.Map(element[0], {
                    zoom: 16,
                    disableDefaultUI: true
                });
                var directionsRenderer = new google.maps.DirectionsRenderer();
                var directionsService = new google.maps.DirectionsService();

                scope.$watch('zoom', function (zoom) {
                    if (zoom) {
                        map.set('zoom', zoom);
                    }
                });

                var markers = [];

                scope.$watch('stations', function (stations) {
                    markers.forEach(function (m) {
                        m.setMap(null);
                    });
                    markers.length = 0;

                    if (!stations) {
                        return;
                    }

                    stations.forEach(function (station) {
                        var marker = new google.maps.Marker({
                            map: map,
                            position: {lat: station.lat, lng: station.lng},
                            title: station.public_name,
                            icon: 'assets/img/car_orb.png'
                        });

                        google.maps.event.addListener(marker, 'click', function () {
                            scope.$apply(function () {
                                $location.path('/station/' + station.id);
                            });
                        });

                        markers.push(marker);
                    });

                });

                scope.$watch('centerOn', function (center) {
                    google.maps.event.trigger(map, 'resize');

                    if (!center) {
                        return;
                    }

                    ((center.lat && center.lng) ? $q.when(center) : geoloc.coordOf(center))
                        .then(function (latlng) {
                            map.panTo(latlng);
                        });
                });

                scope.$watch('meTo', function (target) {
                    directionsRenderer.setMap(null);
                    if (!target) {
                        return;
                    }

                    geoloc.me().then(function (me) {
                        var start = new google.maps.LatLng(me.lat, me.lng);
                        var end = new google.maps.LatLng(target.lat, target.lng);
                        var request = {
                            origin: start,
                            destination: end,
                            travelMode: google.maps.TravelMode.WALKING
                        };
                        directionsService.route(request, function (response, status) {
                            if (status == google.maps.DirectionsStatus.OK) {
                                directionsRenderer.setMap(map);
                                directionsRenderer.setDirections(response);
                                map.set('zoom', 17);
                            }
                        });
                    });

                });

                var watchId = geoloc.watchMe(function (me) {
                    displayMe(map, me);

                    if (scope.followMe) {
                        map && map.panTo(me);
                    }
                });

                scope.$on('$destroy', function () {
                    watchId && navigator.geolocation.clearWatch(watchId);
                });

            }
        };

    }
]);
