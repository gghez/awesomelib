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
  '$scope', 'usage', '$window', '$location',
  function($scope, usage, $window, $location) {

    $scope.Math = $window.Math;

    usage.get().then(function(u) {
      $scope.usage = u;
      $scope.usage.diff = u.cur - u.prev;
    }).catch(function() {
      $location.path('/login');
    });

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
            return true;
          }
        });
      });

      stations.near('park', $scope.station.address).then(function(_carNear) {
        _carNear.some(function(s) {
          if (s.address == $scope.station.address) {
            $scope.station.parks = s.available;
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

        navigator.geolocation && navigator.geolocation.getCurrentPosition(function(me) {
          me.lat = me.coords.latitude;
          me.lng = me.coords.longitude;
          $scope.stations.forEach(function(s) {
            s.distance = distance(s, me);
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

angular.module('awesomelib').service('car', [
  '$http', 'stations',
  function($http, stations) {
    return {
      pending: function() {
        return $http.get('/rest/car/pending').then(function(resp) {
          return resp.data;
        });
      },
      reserveByName: function(type, stationName) {
        var _this = this;

        return stations.all().then(function(allStations) {

          var stationAddress = null;
          if (allStations.some(function(s) { // Find station address
              if (s.name.toLowerCase() == stationName.toLowerCase()) { // Station name found
                stationAddress = s.address;
                console.debug && console.debug('Address found', s.address);
                return true;
              }
            })) {

            return stations.near(type, stationAddress).then(function(nStations) { // Find stations HRID
              var hrId = null;
              if (nStations.some(function(s) { // Station name found
                  if (s.name.toLowerCase() == stationName.toLowerCase()) {
                    hrId = s.hrid;
                    console.debug && console.debug('HRID found', s.hrid);
                    return true;
                  }
                })) {

                return _this.reserve(type, hrId);
              } else {
                console.warn && console.warn('HRID not found.');
              }
            });
          } else {
            console.warn && console.warn('Station not found', stationName);
          }

        });

      },
      reserve: function(type, hrid) {
        return $http.get('/rest/car/reserve/' + type + '/' + hrid).then(function(resp) {
          console.info && console.info('Reservation done', resp.data);
          return resp.data;
        });
      },
      cancel: function(type, reservationId) {
        return $http.get('/rest/car/cancel/' + type + '/' + reservationId).then(function() {
          console.info && console.info('Cancellation done', reservationId);
        });
      }
    };
  }
]);

angular.module('awesomelib').filter('length', [function() {
  return function(arr) {
    return (arr && arr.length) || 0;
  }
}]);

angular.module('awesomelib').service('login', ['$http', '$cookies', function($http, $cookies) {
  return {
    authenticate: function(username, password) {
      return $http.post('/rest/auth/', {
        username: username,
        password: password
      }).then(function(resp) {
        var token = resp.data.token;
        $cookies['AL-TOKEN'] = token;
      });
    }
  };
}]);

angular.module('awesomelib').service('geocoder', ['$q', function($q) {
  var geocoder = new google.maps.Geocoder();

  return {
    addressOf: function(latlng) {
      var defer = $q.defer();

      console.log('Geocoder.addressOf', latlng);
      geocoder.geocode({
        'latLng': latlng
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[1]) {
            console.log('=>', results[1].formatted_address);
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

      console.log('Geocoder.coordOf', address);

      geocoder.geocode({
        'address': address
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          console.log('=>', results[0].geometry.location);
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

angular.module('awesomelib').service('rentals', ['$http', function($http) {
  return {
    get: function() {
      return $http.get('/rest/rentals').then(function(resp) {
        return resp.data;
      });
    }
  };
}]);

angular.module('awesomelib').service('stations', ['$http', function($http) {
  return {
    near: function(type, address) {
      return $http.get('/rest/stations/near/' + type + '/' + address).then(function(resp) {
        return resp.data;
      });
    },
    all: function() {
      return $http.get('/rest/stations/').then(function(resp) {
        return resp.data;
      });
    },
    get: function(stationId) {
      return $http.get('/rest/stations/' + stationId).then(function(resp) {
        return resp.data;
      });
    },
    address: function(address) {
      return $http.get('/rest/stations/address/' + address).then(function(resp) {
        return resp.data;
      });
    }
  };
}]);

angular.module('awesomelib').service('usage', ['$http', function($http) {
  return {
    get: function() {
      return $http.get('/rest/usage').then(function(resp) {
        return resp.data;
      });
    }
  };
}]);
