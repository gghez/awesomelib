angular.module('awesomelib').controller('stationController', [
  '$scope', 'stations', '$routeParams', 'car', '$interval',
  function($scope, stations, $routeParams, car, $interval) {

    var countStop = null;

    function startCountDown(res) {
      countStop && $interval.cancel(countStop);

      var toSplit = res.time.to.split(':'),
        toHours = toSplit[0],
        toMinutes = toSplit[1];

      function update() {
        var now = new Date();
        var to = new Date(now);
        to.setHours(toHours);
        to.setMinutes(toMinutes);
        to.setSeconds(0);
        to.setMilliseconds(0);
        if (to - now < 0) to.setDate(to.getDate() + 1);

        var diff = Math.round((to - now) / 1000);
        var hours = Math.floor(diff / 3600);
        var minutes = Math.floor((diff % 3600) / 60);
        var seconds = diff % 60;

        res.countDown = (hours < 10 ? '0' : '') + hours + ':' +
          (minutes < 10 ? '0' : '') + minutes + ':' +
          (seconds < 10 ? '0' : '') + seconds;
      }

      countStop = $interval(update, 1000);
    }

    function update() {
      stations.near('car', $scope.station.address).then(function(_carNear) {
        _carNear.some(function(s) {
          if (s.address == $scope.station.address) {
            $scope.station.cars = s.available;
            console.debug && console.debug(s.available, 'cars at station');
            return true;
          }
        });
      });

      stations.near('park', $scope.station.address).then(function(_carNear) {
        _carNear.some(function(s) {
          if (s.address == $scope.station.address) {
            $scope.station.parks = s.available;
            console.debug && console.debug(s.available, 'parks at station');
            return true;
          }
        });
      });

      car.pending().then(function(reservations) {
        if (!reservations.some(function(res) {
            if (res.status == 'pending' && res.station.name.toLowerCase() == $scope.station.name.toLowerCase()) {
              $scope.res = res;
              startCountDown(res);
              return true;
            }
          })) {
          $scope.res = null;
        }
      });
    }

    function load() {
      stations.get($routeParams.stationId).then(function(station) {
        station.cars = '-';
        station.parks = '-';

        $scope.station = station;
      }).then(update);
    }

    load();

    $scope.reserve = function(type, stationName) {
      car.reserveByName(type, stationName).then(load);
    };

    $scope.cancel = function(type, reservationId) {
      car.cancel(type, reservationId).then(load);
    };
  }
]);
