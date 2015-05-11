angular.module('awesomelib').controller('stationsController', [
  '$scope', 'stations', '$location', 'car',
  function($scope, stations, $location, car) {

    $scope.Math = Math;

    function load() {
      stations.all().then(function(stations) {
        $scope.stations = stations;
        console.debug && console.debug(stations.length, 'stations retrieved.');

        navigator.geolocation && navigator.geolocation.getCurrentPosition(function(me) {
          console.debug && console.debug('Me', me);

          $scope.$apply(function(){
            me.lat = me.coords.latitude;
            me.lng = me.coords.longitude;
            $scope.stations.forEach(function(s) {
              s.distance = Math.round(0.01 * distance(s, me)) / 10;
            });
          });
          
        });

      });
    }

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

    load();

    $scope.reserve = function(type, stationName) {
      car.reserveByName(type, stationName).then(function() {
        $location.path('/pending/' + type);
      });
    };

  }
]);
