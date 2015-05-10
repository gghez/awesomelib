angular.module('awesomelib').directive('alMap', [
  'stations', '$q', 'geocoder',
  function(stations, $q, geocoder) {

    return {
      restrict: 'E',
      template: '<div id="map-canvas" class="al-map"></div>',
      replace: true,
      scope: {
        centerOn: '=',
        followMe: '='
      },
      link: function(scope, element, attrs) {

        var map, // Map
          me, // LatLng
          markerMe, // Marker
          sMarks = []; // Stations markers

        function initialize() {
          var mapOptions = {
            zoom: 15
          };

          map = new google.maps.Map(element[0], mapOptions);
        }

        initialize();

        var centerMarker = null;
        scope.$watch('centerOn', function(center) {
          if (!center) {
            return;
          }

          map.set('zoom', 16);

          if (centerMarker) {
            centerMarker.setMap(null);
          }

          if (center.lat && center.lng) {
            map.panTo(center);

            geocoder.addressOf(center).then(function(address) {
              centerMarker = new google.maps.Marker({
                map: map,
                position: center,
                title: address
              });
            });

          } else if (typeof center == 'string') {
            geocoder.coordOf(center).then(function(latlng) {
              map.panTo(latlng);
              centerMarker = new google.maps.Marker({
                map: map,
                position: latlng,
                title: center
              });
            });
          }
        });

        if (scope.followMe) {
          navigator.geolocation.watchPosition(function(position) {
            me = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            if (markerMe) markerMe.setMap(null);

            markerMe = new google.maps.Marker({
              position: me,
              map: map,
              title: "You are here!"
            });

            map && map.panTo(me);

            geocoder.addressOf(me).then(function(address) {
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
        } // end scope.followMe


      }
    };

  }
]);
