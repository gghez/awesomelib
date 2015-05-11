angular.module('awesomelib').service('geoloc', ['$q', function ($q) {
    var geocoder = new google.maps.Geocoder();

    function radians(num) {
        return num * Math.PI / 180;
    }

    function distance(pos1, pos2) {
        var R = 6371000; // metres
        var φ1 = radians(pos1.lat);
        var φ2 = radians(pos2.lat);
        var Δφ = radians(pos2.lat - pos1.lat);
        var Δλ = radians(pos2.lng - pos1.lng);

        var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    return {
        distance: distance,
        addressOf: function (latlng) {
            var defer = $q.defer();

            console.debug && console.debug('Geocoder.addressOf', latlng);
            geocoder.geocode({
                'latLng': latlng
            }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        console.debug && console.debug('=>', results[1].formatted_address);
                        defer.resolve(results[1].formatted_address);
                    } else {
                        defer.reject('No address found.');
                    }
                } else {
                    defer.reject('Geocoder failed due to: ' + status);
                }
            });

            return defer.promise;
        },

        coordOf: function (address) {
            var defer = $q.defer();

            console.debug && console.debug('Geocoder.coordOf', address);

            geocoder.geocode({
                'address': address
            }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    console.debug && console.debug('=>', results[0].geometry.location);
                    defer.resolve(results[0].geometry.location);
                } else {
                    defer.reject('Geocode was not successful for the following reason: ' + status);
                }
            });

            return defer.promise;
        },

        me: function () {
            var defer = $q.defer();

            if (!navigator.geolocation) {
                defer.reject('No geolocation API.');
            } else {
                navigator.geolocation.getCurrentPosition(function (pos) {
                    defer.resolve(pos);
                }, function (err) {
                    defer.reject(err);
                });

            }

            return defer.promise;
        }
    };
}]);
