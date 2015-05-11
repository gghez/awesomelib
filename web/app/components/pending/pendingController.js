angular.module('awesomelib').controller('pendingController', [
  '$interval', '$scope', 'reservation', 'stations', '$routeParams', '$anchorScroll', '$location',
  function($interval, $scope, reservation, stations, $routeParams, $anchorScroll, $location) {

    var timers = [];

    function startCountDown(res) {
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

      timers.push($interval(update, 1000));
    }

    function load() {
      timers.forEach(function(t) {
        $interval.cancel(t);
      });
      timers.length = 0;

      reservation.pending().then(function(reservations) {
        $scope.reservations = reservations;

        $scope.reservations.forEach(function(res) {
          stations.get(res.station).then(function(stations){
            res.station = stations[0];
          });

          if (res.status == 'PENDING') {
            startCountDown(res);
          }
        });

      });
    }

    load();

    $scope.cancel = function(type, reservationId) {
      reservation.cancel(type, reservationId).then(load);
    };

    $scope.reserve = function(type, stationId) {
      return reservation.reserve(type, stationId).then(load);
    };
  }
]);
