angular.module('awesomelib').controller('pendingController', [
  '$interval', '$scope', 'car', 'stations', '$routeParams', '$anchorScroll', '$location',
  function($interval, $scope, car, stations, $routeParams, $anchorScroll, $location) {

    var allStations, timers = [];

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

      car.pending().then(function(reservations) {
        $scope.reservations = reservations;

        $scope.reservations.forEach(function(res) {
          allStations.some(function(s){
            if (s.name.toLowerCase() == res.station.name.toLowerCase()){
              res.station = s;
              return true;
            }
          })

          if (res.status.toLowerCase() == 'pending') {
            startCountDown(res);
          }
        });

      });
    }

    stations.all().then(function(all) {
      allStations = all;
    }).then(load);

    $scope.cancel = function(type, reservationId) {
      car.cancel(type, reservationId).then(function() {
        load();
      });
    };

    $scope.reserve = function(type, stationName) {

      return car.reserveByName(type, stationName).then(load);

    };
  }
]);
