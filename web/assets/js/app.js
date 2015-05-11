angular.module('awesomelib', ['ng', 'ngRoute', 'ngCookies']);

angular.module('awesomelib').config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'app/components/home/home.html',
    controller: 'homeController'
  });

  $routeProvider.when('/login', {
    templateUrl: 'app/components/login/login.html',
    controller: 'loginController'
  });

  $routeProvider.when('/status', {
    templateUrl: 'app/components/status/status.html',
    controller: 'statusController'
  });

  $routeProvider.when('/rentals', {
    templateUrl: 'app/components/rentals/rentals.html',
    controller: 'rentalsController'
  });

  $routeProvider.when('/pending', {
    templateUrl: 'app/components/pending/pending.html',
    controller: 'pendingController'
  });

  $routeProvider.when('/pending/:type', {
    templateUrl: 'app/components/pending/pending.html',
    controller: 'pendingController'
  });

  $routeProvider.when('/stations', {
    templateUrl: 'app/components/stations/stations.html',
    controller: 'stationsController'
  });

  $routeProvider.when('/station/:stationId', {
    templateUrl: 'app/components/stations/station.html',
    controller: 'stationController'
  });

  $routeProvider.otherwise({
    redirectTo: '/'
  });
}]);

angular.module('awesomelib').controller('homeController', [
  '$scope', 'rentals', '$window', '$location', 'stations', 'reservation',
  function($scope, rentals, $window, $location, stations, reservation) {

    function load() {
      rentals.get().then(function(history){
        var now = new Date();
        var prev = new Date(now);
        prev.setDate(0);

        $scope.usage ={
          cur: history.filter(function(rental){
            var start = new Date(rental.start);
            return start.getYear() == now.getYear() && start.getMonth() == now.getMonth();
          }).reduce(function(sum, rental){
            return sum += rental.net_amount;
          }, 0) / 100,
          prev: history.filter(function(rental){
            var start = new Date(rental.start);
            return start.getYear() == prev.getYear() && start.getMonth() == prev.getMonth();
          }).reduce(function(sum, rental){
            return sum += rental.net_amount;
          }, 0) / 100
        };

        $scope.usage.diff = $scope.usage.cur - $scope.usage.prev;

      });

    }

    load();

    $scope.reserve = function(type, stationId){
      car.reserve(type, stationId).then(function(){
        $location.path('/pending/' + type);
      });
    };

  }
]);

angular.module('awesomelib').controller('loginController', ['$scope', 'login', '$location', function($scope, login, $location){

  $scope.login = function(){
    login.authenticate($scope.username, $scope.password).then(function(auth){
      $location.path('/');
    }).catch(function(resp){
      $scope.error = resp.data;
    });
  };

}]);

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

angular.module('awesomelib').controller('rentalsController', [
  '$scope', 'rentals', 'stations',
  function($scope, rentals, stations) {

    stations.all().then(function(stations) {

      rentals.get().then(function(rentals) {
        $scope.rentals = rentals;

        $scope.rentals.forEach(function(rental) {

          stations.some(function(s) {
            if (typeof rental.from == 'string' && s.address.toLowerCase() == rental.from.toLowerCase()) {
              rental.from = s;
            } else if (typeof rental.to == 'string' && s.address.toLowerCase() == rental.to.toLowerCase()) {
              rental.to = s;
            }

            if (typeof rental.from == 'object' && typeof rental.to == 'object') {
              return true;
            }

          });

          if (typeof rental.from == 'string') rental.from = {
            address: rental.from
          };
          if (typeof rental.to == 'string') rental.to = {
            address: rental.to
          };


        });

      });

    });



  }
]);

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

angular.module('awesomelib').controller('statusController', ['$scope', 'status', function($scope, status) {

  status.get().then(function(status) {
    $scope.status = status;
  });

}]);

angular.module('awesomelib').service('status', ['$http', function($http) {
  return {
    get: function() {
      return $http.get('/rest/status').then(function(resp) {
        return resp.data;
      });
    }
  };
}]);

angular.module('awesomelib').filter('capitalize', [function() {
  return function(string) {
    return string && typeof string == 'string' && string[0].toUpperCase() + string.substr(1);
  }
}]);

angular.module('awesomelib').filter('length', [function() {
  return function(arr) {
    return (arr && arr.length) || 0;
  }
}]);

angular.module('awesomelib').service('login', [
  '$http',
  function($http) {
    return {
      authenticate: function(username, password) {
        return $http.post('/api/v2/oauth2', {
          username: username,
          password: password
        });
      }
    };
  }
]);

angular.module('awesomelib').service('geocalcul', [function() {

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
    radians: radians,
    distance: distance
  };

}]);

angular.module('awesomelib').service('geocoder', ['$q', function($q) {
  var geocoder = new google.maps.Geocoder();

  return {
    addressOf: function(latlng) {
      var defer = $q.defer();

      console.debug && console.debug('Geocoder.addressOf', latlng);
      geocoder.geocode({
        'latLng': latlng
      }, function(results, status) {
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

    coordOf: function(address) {
      var defer = $q.defer();

      console.debug && console.debug('Geocoder.coordOf', address);

      geocoder.geocode({
        'address': address
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          console.debug && console.debug('=>', results[0].geometry.location);
          defer.resolve(results[0].geometry.location);
        } else {
          defer.reject('Geocode was not successful for the following reason: ' + status);
        }
      });

      return defer.promise;
    }
  };
}]);

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

            // geocoder.addressOf(me).then(function(address) {
            //   console.debug && console.debug('Me detected at', address);
            //   return stations.near('car', address);
            // }).then(function(stations) {
            //   console.debug && console.debug(stations.length, 'stations around.');
            //   sMarks.forEach(function(sMark) {
            //     sMark.setMap(null);
            //   });
            //   stations.forEach(function(station) {
            //     var sMark = new google.maps.Marker({
            //       position: new google.maps.LatLng(station.lat, station.lng),
            //       map: map,
            //       title: station.name
            //     });
            //     sMarks.push(sMark);
            //   });
            // });

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

angular.module('awesomelib').service('rentals', ['$http', function($http) {
  return {
    get: function() {
      return $http.get('/api/v2/rentalshistory').then(function(resp) {
        console.debug && console.debug('[HTTP] Rentals ->', resp.data.results.length);
        return resp.data.results;
      });
    }
  };
}]);

angular.module('awesomelib').service('reservation', [
  '$http', 'subscription',
  function($http, subscription) {
    return {
      pending: function() {
        return $http.get('/api/v2/reservation').then(function(resp) {
          return resp.data.results;
        });
      },
      reserve: function(type, stationId) {
        return subscription.get().then(function(subscriptions) {
          return $http.post('/api/v2/' + type + 'reservation', {
            stationId: stationId,
            subscriberId: subscriptions[0].subscriber_id
          });
        }).then(function(resp) {
          console.info && console.info('Reserved', resp.data);
          return resp.data;
        });;
      },
      cancel: function(type, reservationId) {
        return $http.delete('/api/v2/' + type + 'reservation-cancel/' + reservationId).then(function() {
          console.info && console.info('Canceled', reservationId);
        });
      }
    };
  }
]);

angular.module('awesomelib').service('stations', ['$http', function($http) {
  return {
    all: function() {
      return $http.get('/api/v2/station').then(function(resp) {
        console.debug && console.debug('[HTTP] Stations ->', resp.data.results.length);
        return resp.data.results;
      });
    },
    get: function(stationId) {
      return $http.get('/api/v2/station/' + encodeURIComponent(stationId)).then(function(resp) {
        console.debug && console.debug('[HTTP] Stations ->', resp.data.results.length);
        return resp.data.results;
      });
    }
  };
}]);

angular.module('awesomelib').service('subscription', [
  '$http',
  function($http) {
    return {
      get: function() {
        return $http.get('/api/v2/subscription').then(function(resp) {
          return resp.data.results;
        });
      }
    };
  }
]);
