angular.module('awesomelib').directive('alMap', ['stations', '$q', function(stations, $q) {

  return {
    restrict: 'E',
    template: '<div id="map-canvas" class="al-map"></div>',
    replace: true,
    link: function(scope, element, attrs) {

      var map, // Map
        me, // LatLng
        markerMe, // Marker
        geocoder = new google.maps.Geocoder(),
        sMarks = []; // Stations markers

      function initialize() {
        console.log('Initialize called.');
        var mapOptions = {
          zoom: 15
        };
        map = new google.maps.Map(element[0], mapOptions);
      }

      initialize();

      function addressOfMe() {
        var defer = $q.defer();

        geocoder.geocode({
          'latLng': me
        }, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (results[1]) {
              defer.resolve(results[1].formatted_address);
            } else {
              defer.reject('No address found.');
            }
          } else {
            defer.reject('Geocoder failed due to: ' + status);
          }
        });

        return defer.promise;
      }

      navigator.geolocation.watchPosition(function(position) {
        me = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        if (markerMe) markerMe.setMap(null);

        markerMe = new google.maps.Marker({
          position: me,
          map: map,
          title: "You are here!"
        });

        map && map.panTo(me);

        addressOfMe().then(function(address) {
          console.log('Me detected at', address);
          return stations.near(address);
        }).then(function(stations) {
          console.log('stations', stations);
          sMarks.forEach(function(sMark) {
            sMark.setMap(null);
          });
          stations.forEach(function(station) {
            var sMark = new google.maps.Marker({
              position: new google.maps.LatLng(station.lat, station.lng),
              map: map,
              title: station.name
            });
            sMarks.push(sMark);
          });
        });

      }, function(err) {
        console.error(err);
      }, {
        maximumAge: 0,
        enableHighAccuracy: true
      });

    }
  };

}]);
