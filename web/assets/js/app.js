angular.module('awesomelib', ['ng', 'ngRoute', 'ngCookies', 'bsLoader']);

angular.module('awesomelib').config(['$routeProvider', function ($routeProvider) {
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

    $routeProvider.when('/stations/favourite', {
        templateUrl: 'app/components/stations/stations.html',
        controller: 'stationsController'
    });

    $routeProvider.when('/bills', {
        templateUrl: 'app/components/bills/bills.html',
        controller: 'billsController'
    });

    $routeProvider.when('/station/:stationId', {
        templateUrl: 'app/components/stations/station.html',
        controller: 'stationController'
    });

    $routeProvider.otherwise({
        redirectTo: '/'
    });
}]);

angular.module('awesomelib').controller('billsController', [
    '$scope', 'bills',
    function ($scope, bills) {

        function load() {
            bills.get().then(function (bills) {

                var total = 0;
                bills.forEach(function (b) {
                    b.due_date = new Date(b.due_date);
                    b.issue_date = new Date(b.issue_date);

                    total += b.amount_net;
                });

                $scope.beginning = new Date(bills[bills.length - 1].issue_date);

                $scope.total_amount = total;
                $scope.bills = bills;
            });
        }

        load();

    }
]);

angular.module('awesomelib').controller('homeController', [
    '$scope', 'rentals', '$window', '$location', 'geoloc', 'info', 'stations', 'Loader', '$q',
    function ($scope, rentals, $window, $location, geoloc, info, stations, Loader, $q) {

        var me = null;

        function nearest(type) {
            return geoloc.me().then(function (_me) {
                me = _me;
                return stations.near(_me, function (s) {
                    return (type == 'car' ? s.cars : s.parks) > 0;
                });
            }).then(function (_stations) {
                $scope.stations = _stations;
                $scope.nearest = _stations[0];
            });
        }

        function load() {
            Loader.start('home');

            var rentalsLoad = rentals.get().then(function (history) {
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
            });


            var nearestLoad = nearest('car');

            $q.all([rentalsLoad, nearestLoad]).finally(function () {
                Loader.stop('home');
                $scope.initialPosition = me;
            });
        }

        load();


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
    '$interval', '$scope', 'reservation', 'stations',
    function ($interval, $scope, reservation, stations) {

        function load() {

            reservation.pending().then(function (reservations) {
                $scope.reservations = reservations;

                $scope.reservations.forEach(function (res) {
                    stations.get(res.station).then(function (stations) {
                        res.station = stations[0];
                    });
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

angular.module('awesomelib').directive('alStationCard', [function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/stations/stationCard.html',
        scope: {
            station: '=',
            noCar: '=',
            noPark: '='
        },
        controller: ['$scope', 'reservation', function ($scope, reservation) {
            function update() {
                $scope.res = null;
                reservation.pending().then(function (reservations) {
                    reservations.some(function (r) {
                        if (r.station == $scope.station.id && r.status == 'PENDING') {
                            $scope.res = r;
                            return true;
                        }
                    });
                });
            }

            $scope.$watch('station', function (station) {
                if (station) {
                    update();
                }
            });

            $scope.reserve = function (type, stationId) {
                reservation.reserve(type, stationId).then(function (res) {
                    $scope.res = res;
                });
            };

            $scope.cancel = function () {
                var type = $scope.res.kind.replace('reservation', '');
                reservation.cancel(type, $scope.res.reservation_id).then(update);
            };
        }]
    };
}]);

angular.module('awesomelib').controller('stationController', [
    '$scope', 'stations', '$routeParams', 'reservation', '$interval',
    function ($scope, stations, $routeParams, reservation, $interval) {

        function load() {
            stations.get($routeParams.stationId).then(function (stations) {
                $scope.stations = stations;
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

        $scope.cancel = function () {
            var type = $scope.res.kind.replace('reservation', '');
            reservation.cancel(type, $scope.res.reservation_id).then(load);
        };
    }
]);

angular.module('awesomelib').controller('stationsController', [
    '$scope', 'stations', '$location', 'reservation', 'geoloc', 'Loader', 'info', '$routeParams',
    function ($scope, stations, $location, reservation, geoloc, Loader, info) {

        $scope.favourite = /favourite/.test($location.path());

        function load() {
            Loader.start('stations');

            geoloc.me().then(function (me) { // try current GPS location
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
                return $scope.favourite ? stations.favourite().then(function (_stations) {
                    return _stations.map(function (s) {
                        return (s.distance = Math.round(0.01 * geoloc.distance(s, pos)) / 10) && s;
                    });
                }) : stations.near(pos, function (s) {
                    return s.cars > 0;
                });
            }).then(function (_stations) {
                $scope.stations = _stations;
            }).finally(function () {
                Loader.stop('stations');
            });
        }

        load();


    }
]);

angular.module('awesomelib').service('bills', ['$http', function ($http) {

    return {
        get: function () {
            return $http.get('/api/v2/bill').then(function(resp) {
                console.debug && console.debug('[HTTP] Bills ->', resp.data.results.length);
                return resp.data.results;
            });
        }
    };

}]);

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
            //var timer = null;

            function onLoadingStateChanged(loading, text) {
                scope.$evalAsync(function () {
                    if (loading) {
                        //timer && $timeout.cancel(timer);
                        scope.loading = loading;
                        scope.loaderText = text || DEFAULT_LOADER_TEXT;
                    } else {
                        //timer = $timeout(function () {
                        scope.loading = false;
                        //}, 500);
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

        update();

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
                    var me = {lat: pos.coords.latitude, lng: pos.coords.longitude};
                    console.debug && console.debug('Me', me);
                    defer.resolve(me);
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
            if (!callback) {
                console.error('No callback defined for geolocation watching.');
                return;
            }

            if (!navigator.geolocation) {
                console.error('No geolocation API.');
                return;
            }

            return navigator.geolocation.watchPosition(function (pos) {
                var me = {lat: pos.coords.latitude, lng: pos.coords.longitude};
                console.debug && console.debug('Me [update]', me);
                callback(me);
            }, function (err) {
                console.error('geoloc watch', err);
            }, {
                maximumAge: 0,
                enableHighAccuracy: true
            });
        }
    };
}]);

angular.module('awesomelib').directive('alMap', [
    'stations', '$q', 'geoloc', '$location',
    function (stations, $q, geoloc, $location) {

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

        return {
            restrict: 'E',
            template: '<div class="al-map"></div>',
            replace: true,
            scope: {
                centerOn: '=',
                followMe: '=',
                zoom: '=',
                stations: '=',
                meTo: '='
            },
            link: function (scope, element, attrs) {

                var map = new google.maps.Map(element[0], {
                    zoom: 16,
                    disableDefaultUI: true
                });
                var directionsRenderer = new google.maps.DirectionsRenderer();
                var directionsService = new google.maps.DirectionsService();

                scope.$watch('zoom', function (zoom) {
                    if (zoom) {
                        map.set('zoom', zoom);
                    }
                });

                var markers = [];

                scope.$watch('stations', function (stations) {
                    markers.forEach(function (m) {
                        m.setMap(null);
                    });
                    markers.length = 0;

                    if (!stations) {
                        return;
                    }

                    stations.forEach(function (station) {
                        var marker = new google.maps.Marker({
                            map: map,
                            position: {lat: station.lat, lng: station.lng},
                            title: station.public_name,
                            icon: 'assets/img/car_orb.png'
                        });

                        google.maps.event.addListener(marker, 'click', function () {
                            scope.$apply(function () {
                                $location.path('/station/' + station.id);
                            });
                        });

                        markers.push(marker);
                    });

                });

                scope.$watch('centerOn', function (center) {
                    google.maps.event.trigger(map, 'resize');

                    if (!center) {
                        return;
                    }

                    ((center.lat && center.lng) ? $q.when(center) : geoloc.coordOf(center))
                        .then(function (latlng) {
                            map.panTo(latlng);
                        });
                });

                scope.$watch('meTo', function (target) {
                    directionsRenderer.setMap(null);
                    if (!target) {
                        return;
                    }

                    geoloc.me().then(function (me) {
                        var start = new google.maps.LatLng(me.lat, me.lng);
                        var end = new google.maps.LatLng(target.lat, target.lng);
                        var request = {
                            origin: start,
                            destination: end,
                            travelMode: google.maps.TravelMode.WALKING
                        };
                        directionsService.route(request, function (response, status) {
                            if (status == google.maps.DirectionsStatus.OK) {
                                directionsRenderer.setMap(map);
                                directionsRenderer.setDirections(response);
                                map.set('zoom', 17);
                            }
                        });
                    });

                });

                var watchId = geoloc.watchMe(function (me) {
                    displayMe(map, me);

                    if (scope.followMe) {
                        map && map.panTo(me);
                    }
                });

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
    '$http', 'subscription', '$q', '$timeout',
    function ($http, subscription, $q, $timeout) {
        return {
            pending: function () {
                return $http.get('/api/v2/reservation').then(function (resp) {
                    return pendings = resp.data.results;
                });
            },
            reserve: function (type, stationId) {
                return subscription.get().then(function (subscriptions) {
                    return $http.post('/api/v2/' + type + 'reservation', {
                        stationId: stationId,
                        subscriberId: subscriptions[0].subscriber_id
                    });
                }).then(function (resp) {
                    console.info && console.info(type, 'reserved', resp.data);
                    return resp.data;
                });
                ;
            },
            cancel: function (type, reservationId) {
                return $http.delete('/api/v2/' + type + 'reservation-cancel/' + reservationId).then(function () {
                    console.info && console.info(type, 'canceled', reservationId);
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
            near: function (loc, filter) {
                var _this = this;
                filter = filter || function (s) {
                        return s;
                    };

                return ((loc.lat && loc.lng) ? $q.when(loc) : geoloc.coordOf(loc))
                    .then(function (latlng) {
                        loc = latlng;
                        return _this.all();
                    })
                    .then(function (stations) {
                        stations = stations.filter(filter);

                        stations.forEach(function (s) {
                            s.distance = Math.round(0.01 * geoloc.distance(s, loc)) / 10;
                        });

                        stations.sort(function (s1, s2) {
                            return s1.distance < s2.distance ? -1 : 1;
                        });

                        var nearest = stations.slice(0, 10);
                        console.debug && console.debug('Near', loc, nearest);

                        return nearest;
                    });
            },
            favourite: function () {
                var _this = this;

                return $http.get('/api/v2/favourite').then(function (resp) {
                    console.debug && console.debug('[HTTP] Stations ->', resp.data.results.length);
                    var stationIds = resp.data.results.map(function (s) {
                        return s.id
                    }).join(',');
                    return _this.get(stationIds);
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
