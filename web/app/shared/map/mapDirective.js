angular.module('awesomelib').directive('alMap', [
    'stations', '$q', 'geoloc', '$timeout',
    function (stations, $q, geoloc, $timeout) {

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

        var markers = [];

        function displayStations(map, latlng) {
            markers.forEach(function (m) {
                m.setMap(null);
            });
            markers.length = 0;

            stations.near(latlng).then(function (stations) {
                stations.forEach(function (station, i) {
                    $timeout(function () {
                        var marker = new google.maps.Marker({
                            map: map,
                            position: {lat: station.lat, lng: station.lng},
                            animation: google.maps.Animation.DROP,
                            title: station.public_name
                        });

                        //function toggleBounce() {
                        //
                        //    if (marker.getAnimation() != null) {
                        //        marker.setAnimation(null);
                        //    } else {
                        //        marker.setAnimation(google.maps.Animation.BOUNCE);
                        //    }
                        //}
                        //
                        //google.maps.event.addListener(marker, 'click', toggleBounce);

                        markers.push(marker);
                    }, i * 100);
                });
            });
        }

        return {
            restrict: 'E',
            template: '<div id="map-canvas" class="al-map"></div>',
            replace: true,
            scope: {
                centerOn: '=',
                followMe: '='
            },
            link: function (scope, element, attrs) {

                var map;

                function initialize() {
                    var mapOptions = {
                        zoom: 16
                    };

                    map = new google.maps.Map(element[0], mapOptions);
                }

                initialize();

                scope.$watch('centerOn', function (center) {
                    if (!center) {
                        return;
                    }

                    ((center.lat && center.lng) ? $q.when(center) : geoloc.coordOf(center))
                        .then(function (latlng) {
                            map.panTo(latlng);
                            displayStations(map, latlng);
                        });
                });


                function onPositionChange(position) {
                    var me = {lat: position.coords.latitude, lng: position.coords.longitude};

                    map && map.panTo(me);

                    displayMe(map, me);
                    displayStations(map, me);
                }

                var watchId = null;
                scope.$watch('followMe', function (activated) {
                    if (!activated) {
                        watchId && navigator.geolocation.clearWatch(watchId);
                    } else if (navigator.geolocation) {
                        watchId = navigator.geolocation.watchPosition(onPositionChange, function (err) {
                            console.warn('Cannot watch current position.', err);
                        }, {
                            maximumAge: 0,
                            enableHighAccuracy: true
                        });
                    }
                });

            }
        };

    }
]);
