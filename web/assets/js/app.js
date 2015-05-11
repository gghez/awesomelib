angular.module('awesomelib', ['ng', 'ngRoute', 'ngCookies', 'bsLoader']);

angular.module('awesomelib').config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'app/components/home/home.html',
    controller: 'homeController'
  });

  $routeProvider.when('/login', {
    templateUrl: 'app/components/login/login.html',
    controller: 'loginController'
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
    function ($interval, $scope, reservation, stations, $routeParams, $anchorScroll, $location) {

        var timers = [];

        function startCountDown(res) {
            timers.forEach(function (t) {
                $interval.cancel(t);
            });
            timers.length = 0;

            var countDown = res.seconds_before_expiration;

            function update() {
                var hours = Math.floor(--countDown / 3600);
                var minutes = Math.floor((countDown % 3600) / 60);
                var seconds = countDown % 60;

                res.countDown = (hours < 10 ? '0' : '') + hours + ':' +
                    (minutes < 10 ? '0' : '') + minutes + ':' +
                    (seconds < 10 ? '0' : '') + seconds;
            }

            timers.push($interval(update, 1000));
        }

        function load() {
            timers.forEach(function (t) {
                $interval.cancel(t);
            });
            timers.length = 0;

            reservation.pending().then(function (reservations) {
                $scope.reservations = reservations;

                $scope.reservations.forEach(function (res) {
                    stations.get(res.station).then(function (stations) {
                        res.station = stations[0];
                    });

                    if (res.status == 'PENDING') {
                        startCountDown(res);
                    }
                });

            });
        }

        load();

        $scope.cancel = function (type, reservationId) {
            reservation.cancel(type, reservationId).then(load);
        };

        $scope.reserve = function (type, stationId) {
            return reservation.reserve(type, stationId).then(load);
        };
    }
]);

angular.module('awesomelib').controller('rentalsController', [
    '$scope', 'rentals',
    function ($scope, rentals) {

        function load() {
            rentals.get().then(function (history) {
                var now = new Date();

                $scope.rentals = history.filter(function (rental) {
                    var start = new Date(rental.start);
                    return start.getYear() == now.getYear() && start.getMonth() == now.getMonth();
                });

            });
        }

        load();

    }
]);

angular.module('awesomelib').controller('stationController', [
    '$scope', 'stations', '$routeParams', 'reservation', '$interval',
    function ($scope, stations, $routeParams, reservation, $interval) {

        var countStop = null;

        function startCountDown(res) {
            countStop && $interval.cancel(countStop);
            var countDown = res.seconds_before_expiration;

            function update() {
                var hours = Math.floor(--countDown / 3600);
                var minutes = Math.floor((countDown % 3600) / 60);
                var seconds = countDown % 60;

                res.countDown = (hours < 10 ? '0' : '') + hours + ':' +
                    (minutes < 10 ? '0' : '') + minutes + ':' +
                    (seconds < 10 ? '0' : '') + seconds;
            }

            countStop = $interval(update, 1000);
        }

        function load() {
            stations.get($routeParams.stationId).then(function (stations) {
                $scope.station = stations[0];

                reservation.pending().then(function (reservations) {
                    if (!reservations.some(function (r) {
                            if (r.station == $scope.station.id && r.status == 'PENDING') {
                                $scope.res = r;
                                startCountDown(r);
                                return true;
                            }
                        })) {
                        $scope.res = null;
                    }
                });
            });
        }

        load();

        $scope.reserve = function (type, stationId) {
            reservation.reserve(type, stationId).then(load);
        };

        $scope.cancel = function (kind, reservationId) {
            var type = kind.replace('reservation', '');
            reservation.cancel(type, reservationId).then(load);
        };
    }
]);

angular.module('awesomelib').controller('stationsController', [
    '$scope', 'stations', '$location', 'reservation', 'geoloc', 'Loader',
    function ($scope, stations, $location, reservation, geoloc, Loader) {

        $scope.Math = Math;

        function load() {
            Loader.start('stations');

            var _stations;
            stations.all().then(function (stations) {
                _stations = stations;
                return geoloc.me();
            }).then(function (me) {
                me.lat = me.coords.latitude;
                me.lng = me.coords.longitude;

                _stations.forEach(function (s) {
                    s.distance = Math.round(0.01 * geoloc.distance(s, me)) / 10;
                });

                _stations.sort(function (s1, s2) {
                    return s1.distance < s2.distance ? -1 : 1;
                });

                $scope.stations = _stations.slice(0, 10);

                return geoloc.addressOf(me);
            }).then(function (address) {
                $scope.currentAddress = address;
            }).finally(function () {
                Loader.stop('stations');
            });
        }

        load();

        $scope.reserve = function (type, stationId) {
            reservation.reserve(type, stationId).then(function () {
                $location.path('/pending/' + type);
            });
        };

    }
]);

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

angular.module('awesomelib').directive('alMap', [
  'stations', '$q', 'geoloc',
  function(stations, $q, geoloc) {

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
