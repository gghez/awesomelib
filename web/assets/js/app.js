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
    '$scope', 'rentals', '$window', '$location', 'geoloc', 'info',
    function ($scope, rentals, $window, $location, geoloc, info) {

        function load() {
            rentals.get().then(function (history) {
                var now = new Date();
                var prev = new Date(now);
                prev.setDate(0);

                $scope.usage = {
                    cur: history.filter(function (rental) {
                        var start = new Date(rental.start);
                        return start.getYear() == now.getYear() && start.getMonth() == now.getMonth();
                    }).reduce(function (sum, rental) {
                        return sum + rental.net_amount;
                    }, 0) / 100,
                    prev: history.filter(function (rental) {
                        var start = new Date(rental.start);
                        return start.getYear() == prev.getYear() && start.getMonth() == prev.getMonth();
                    }).reduce(function (sum, rental) {
                        return sum + rental.net_amount;
                    }, 0) / 100
                };

                $scope.usage.diff = $scope.usage.cur - $scope.usage.prev;
            });

            info.get().then(function (ci) {
                return geoloc.coordOf([ci.address.street, ci.address.zipcode, ci.address.city].join(', '));
            }).then(function (latlng) {
                $scope.initialPosition = latlng;
            });
        }

        load();

        $scope.reserve = function (type, stationId) {
            car.reserve(type, stationId).then(function () {
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

        function load() {
            stations.get($routeParams.stationId).then(function (stations) {
                $scope.station = stations[0];

                reservation.pending().then(function (reservations) {
                    if (!reservations.some(function (r) {
                            if (r.station == $scope.station.id && r.status == 'PENDING') {
                                $scope.res = r;
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
    '$scope', 'stations', '$location', 'reservation', 'geoloc', 'Loader', 'info',
    function ($scope, stations, $location, reservation, geoloc, Loader, info) {

        function load() {
            Loader.start('stations');

            geoloc.me().then(function (me) { // try current GPS location
                me.lat = me.coords.latitude;
                me.lng = me.coords.longitude;

                return geoloc.addressOf(me).then(function (address) {
                    $scope.currentAddress = address;
                    return me;
                });
            }).catch(function (err) { // Else try customer home location
                console.warn('geoloc failed, use customer home.', err);

                return info.get().then(function (ci) {
                    $scope.currentAddress = [ci.address.street, ci.address.zipcode, ci.address.city].join(', ');
                    return geoloc.coordOf($scope.currentAddress);
                });
            }).then(function (pos) { // Select nearest stations from reference position
                return stations.near(pos);
            }).then(function (stations) {
                $scope.stations = stations;
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

angular.module('bsLoader', ['ng', 'angularNotification']);

angular.module('bsLoader').directive('bsLoader', ['Loader', '$timeout', function (Loader, $timeout) {

    var DEFAULT_LOADER_TEXT = 'Loading...';

    return {
        template: '<div ng-show="loading"><span class="bs-loader glyphicon glyphicon-refresh"></span> ' +
        '<span class="bs-loader-text" ng-bind="loaderText"></span></div>',
        replace: true,
        restrict: 'E',
        scope: {},
        link: function (scope) {
            var timer = null;

            function onLoadingStateChanged(loading, text) {
                scope.$evalAsync(function () {
                    if (loading) {
                        timer && $timeout.cancel(timer);
                        scope.loading = loading;
                        scope.loaderText = text || DEFAULT_LOADER_TEXT;
                    } else {
                        timer = $timeout(function () {
                            scope.loading = false;
                        }, 500);
                    }
                });
            }

            Loader.register(onLoadingStateChanged);

            scope.$on('$destroy', function () {
                Loader.unregister(onLoadingStateChanged);
            });
        }
    };

}]);

angular.module('bsLoader').directive('bsLoaderHide', ['Loader', function (Loader) {

    return {
        restrict: 'A',
        link: function (scope, element) {
            function onLoadingStateChanged(loading) {
                if (loading) {
                    element.addClass('ng-hide');
                } else {
                    element.removeClass('ng-hide');
                }
            }

            Loader.register(onLoadingStateChanged);

            scope.$on('$destroy', function () {
                Loader.unregister(onLoadingStateChanged);
            });
        }
    };

}]);

angular.module('bsLoader').service('Loader', ['Notification', function (Notification) {

    var LOADER_CHANNEL = 'loader';

    var loadStates = {};

    function firstLoadingTaskText() {
        var text = '';

        Object.keys(loadStates).some(function (t) {
            if (loadStates[t].loading) {
                text = loadStates[t].text;
                return true;
            }
        });

        return text;
    }

    return {
        register: function (cb) {
            cb(this.isLoading(), firstLoadingTaskText());
            Notification.register(LOADER_CHANNEL, cb);
        },

        unregister: function (cb) {
            Notification.unregister(LOADER_CHANNEL, cb);
        },

        start: function (task, text) {
            loadStates[task] = {text: text, loading: true};
            Notification.notify(LOADER_CHANNEL, this.isLoading(), text);
        },

        stop: function (task) {
            loadStates[task].loading = false;
            Notification.notify(LOADER_CHANNEL, this.isLoading(), firstLoadingTaskText());
        },

        isLoading: function () {
            return Object.keys(loadStates).some(function (task) {
                return loadStates[task].loading;
            });
        }
    };

}]);

angular.module('bsLoader').directive('bsLoaderShow', ['Loader', function (Loader) {

    return {
        restrict: 'A',
        link: function (scope, element) {
            function onLoadingStateChanged(loading) {
                if (!loading) {
                    element.addClass('ng-hide');
                } else {
                    element.removeClass('ng-hide');
                }
            }

            Loader.register(onLoadingStateChanged);

            scope.$on('$destroy', function () {
                Loader.unregister(onLoadingStateChanged);
            });
        }
    };

}]);

angular.module('awesomelib').service('control', [
    '$http',
    function ($http) {
        return {
            version: function () {
                return $http.get('/api/version').then(function (resp) {
                    return resp.data.version;
                });
            }
        };
    }
]);

angular.module('awesomelib').directive('alCountDown', ['$interval', function ($interval) {

    var countStop = null;

    function startCountDown(element, seconds) {
        stopCountDown();

        var countDown = seconds;

        function update() {
            var hours = Math.floor(--countDown / 3600);
            var minutes = Math.floor((countDown % 3600) / 60);
            var seconds = countDown % 60;

            var display = (hours < 10 ? '0' : '') + hours + ':' +
                (minutes < 10 ? '0' : '') + minutes + ':' +
                (seconds < 10 ? '0' : '') + seconds;

            element.text(display);
        }

        countStop = $interval(update, 1000);
    }

    function stopCountDown() {
        countStop && $interval.cancel(countStop);
    }

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            scope.$watch(attrs.alCountDown, function (seconds) {
                if (seconds) {
                    startCountDown(element, seconds);
                } else {
                    stopCountDown();
                }
            });

            scope.$on('$destroy', function () {
                stopCountDown();
            });
        }
    }

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

angular.module('awesomelib').service('info', [
    '$http',
    function ($http) {
        return {
            get: function () {
                return $http.get('/api/v2/customerinformation').then(function (resp) {
                    return resp.data;
                });
            }
        };
    }
]);

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

angular.module('awesomelib').controller('mainController', [
    '$scope', 'control',
    function ($scope, control) {

        control.version().then(function (version) {
            $scope.version = version;
        });

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

            geocoder.geocode({
                'address': address
            }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var latlng = {lat: results[0].geometry.location.A, lng: results[0].geometry.location.F};
                    console.debug && console.debug('Geocoder.coordOf', address, latlng);
                    defer.resolve(latlng);
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
                }, {
                    maximumAge: 0,
                    enableHighAccuracy: true
                });
            }

            return defer.promise;
        },

        watchMe: function (callback) {
            if (!navigator.geolocation) {
                console.error('No geolocation API.');
                return;
            }

            navigator.geolocation.watchPosition(callback, function (err) {
                console.error('geoloc watch', err);
            }, {
                maximumAge: 0,
                enableHighAccuracy: true
            });
        }
    };
}]);

angular.module('awesomelib').directive('alMap', [
    'stations', '$q', 'geoloc', '$timeout', '$location',
    function (stations, $q, geoloc, $timeout, $location) {

        var markerMe = null;

        function displayMe(map, latlng) {
            if (markerMe) markerMe.setMap(null);

            markerMe = new google.maps.Marker({
                position: latlng,
                map: map,
                title: "You are here!",
                icon: 'assets/img/blue-circle-10.png'
            });
        }

        var markers = [];

        function displayStations(scope, map, latlng) {
            stations.near(latlng).then(function (stations) {
                markers.forEach(function (m) {
                    m.setMap(null);
                });
                markers.length = 0;

                stations.forEach(function (station, i) {
                    //$timeout(function () {
                    var marker = new google.maps.Marker({
                        map: map,
                        position: {lat: station.lat, lng: station.lng},
                        //animation: google.maps.Animation.DROP,
                        title: station.public_name
                    });

                    //function toggleBounce() {
                    //
                    //    if (marker.getAnimation() != null) {
                    //        marker.setAnimation(null);
                    //    } else {
                    //        marker.setAnimation(google.maps.Animation.BOUNCE);
                    //    }
                    //}
                    //
                    google.maps.event.addListener(marker, 'click', function () {
                        scope.$apply(function () {
                            $location.path('/station/' + station.id);
                        });
                    });

                    markers.push(marker);
                    //}, i * 100);
                });
            });
        }

        return {
            restrict: 'E',
            template: '<div id="map-canvas" class="al-map"></div>',
            replace: true,
            scope: {
                centerOn: '=',
                followMe: '='
            },
            link: function (scope, element, attrs) {

                var map;

                function initialize() {
                    var mapOptions = {
                        zoom: 16
                    };

                    map = new google.maps.Map(element[0], mapOptions);
                }

                initialize();

                scope.$watch('centerOn', function (center) {
                    if (!center) {
                        return;
                    }

                    ((center.lat && center.lng) ? $q.when(center) : geoloc.coordOf(center))
                        .then(function (latlng) {
                            map.panTo(latlng);
                            displayStations(scope, map, latlng);
                        });
                });


                function onPositionChange(position) {
                    var me = {lat: position.coords.latitude, lng: position.coords.longitude};
                    displayMe(map, me);

                    if (scope.followMe) {
                        map && map.panTo(me);
                        displayStations(scope, map, me);
                    }
                }

                var watchId = null;
                if (navigator.geolocation) {
                    watchId = navigator.geolocation.watchPosition(onPositionChange, function (err) {
                        console.warn('Cannot watch current position.', err);
                    }, {
                        maximumAge: 0,
                        enableHighAccuracy: true
                    });
                }

                scope.$on('$destroy', function () {
                    watchId && navigator.geolocation.clearWatch(watchId);
                });

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

angular.module('awesomelib').service('stations', [
    '$http', '$q', 'geoloc',
    function ($http, $q, geoloc) {
        return {
            all: function () {
                return $http.get('/api/v2/station').then(function (resp) {
                    console.debug && console.debug('[HTTP] Stations ->', resp.data.results.length);
                    return resp.data.results;
                });
            },
            get: function (stationId) {
                return $http.get('/api/v2/station/' + encodeURIComponent(stationId)).then(function (resp) {
                    console.debug && console.debug('[HTTP] Stations ->', resp.data.results.length);
                    return resp.data.results;
                });
            },
            near: function (loc) {
                var _this = this;

                return ((loc.lat && loc.lng) ? $q.when(loc) : geoloc.coordOf(loc))
                    .then(function (latlng) {
                        loc = latlng;
                        return _this.all();
                    })
                    .then(function (stations) {
                        stations.forEach(function (s) {
                            s.distance = Math.round(0.01 * geoloc.distance(s, loc)) / 10;
                        });

                        stations.sort(function (s1, s2) {
                            return s1.distance < s2.distance ? -1 : 1;
                        });

                        return stations.slice(0, 10);
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
