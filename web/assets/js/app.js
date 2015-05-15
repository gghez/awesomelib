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
    '$scope', 'bills', 'Loader', '$location',
    function ($scope, bills, Loader, $location) {

        function load() {
            Loader.start('bills');

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
            }).catch(function(err){
               if (err.status == 401){
                   $location.path('/login');
               }
            }).finally(function(){
                Loader.stop('bills');
            });
        }

        load();

    }
]);

angular.module('awesomelib').controller('homeController', [
    '$scope', 'rentals', '$window', '$location', 'geoloc', 'info', 'stations', 'Loader', '$q',
    function($scope, rentals, $window, $location, geoloc, info, stations, Loader, $q) {

        var me = null;

        function loadRentalsSummary() {
            return rentals.get().then(function(history) {
                var now = new Date();
                var prev = new Date(now);
                prev.setDate(0);

                $scope.usage = {
                    cur: history.filter(function(rental) {
                        var start = new Date(rental.start);
                        return start.getYear() == now.getYear() && start.getMonth() == now.getMonth();
                    }).reduce(function(sum, rental) {
                        return sum + rental.net_amount;
                    }, 0) / 100,
                    prev: history.filter(function(rental) {
                        var start = new Date(rental.start);
                        return start.getYear() == prev.getYear() && start.getMonth() == prev.getMonth();
                    }).reduce(function(sum, rental) {
                        return sum + rental.net_amount;
                    }, 0) / 100
                };
            });
        }

        function loadMap() {
            var defer = $q.defer();

            var watchId = geoloc.watchMe(function(err, _me) {
                if (err) {
                    defer.reject(err);
                } else {
                    me = _me;
                    stations.near(_me, function(s) {
                        return s.cars > 0;
                    }).then(function(_stations) {
                        $scope.stations = _stations;
                        $scope.nearest = _stations[0];
                        defer.resolve();
                    });
                }
            });

            $scope.$on('$destroy', function() {
                geoloc.unwatch(watchId);
            });

            return defer.promise;
        }

        Loader.start('home');

        var rentalsSummary = loadRentalsSummary();
        var mapInit = loadMap();

        $q.all([rentalsSummary, mapInit]).catch(function(err) {
            if (err.status == 401) {
                $location.path('/login');
            } else {
                console.error('Failed to initialize some home page component.', err);
            }
        }).finally(function() {
            Loader.stop('home');
            $scope.initialPosition = me;
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

angular.module('awesomelib').directive('alPendingCard', [function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/pending/pendingCard.html',
        scope: {
            reservation: '='
        },
        controller: ['$scope', 'reservation', function($scope, reservation) {
            /*$scope.$watch('reservation', function(res) {
                if (res) {
                    var date = new Date(res.created_at);
                    var now = new Date();
                    if (now.toDateString() == date.toDateString()) {
                        res.humanDate = 'Today';
                    } else {
                        res.humanDate = date.toLocaleString();
                    }
                }
            });*/

            $scope.cancel = function() {
                reservation.cancel($scope.reservation.kind.replace('reservation', ''), $scope.reservation.reservation_id).then(function() {
                    return reservation.pending();
                }).then(function(_reservations) {
                    _reservations.some(function(r) {
                        if (r.reservation_id == $scope.reservation.reservation_id) {
                            $scope.reservation.status = r.status;
                            return true;
                        }
                    });
                });
            };

        }]
    };
}]);

angular.module('awesomelib').controller('pendingController', [
    '$interval', '$scope', 'reservation', 'stations', 'Loader', '$location',
    function ($interval, $scope, reservation, stations, Loader, $location) {

        function load() {
            Loader.start('pending');

            reservation.pending().then(function (reservations) {
                $scope.reservations = reservations;

                $scope.reservations.forEach(function (res) {
                    stations.get(res.station).then(function (stations) {
                        res.station = stations[0];
                    });
                });

            }).catch(function (err) {
                if (err.status == 401) {
                    $location.path('/login');
                }
            }).finally(function () {
                Loader.stop('pending');
            });
        }

        load();
    }
]);

angular.module('awesomelib').directive('alRentalCard', [function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/rentals/rentalCard.html',
        scope: {
            rental: '='
        },
        link: function(scope) {
            scope.$watch('rental', function(rental) {
                if (rental) {
                    var startDate = new Date(rental.start);
                    var now = new Date();
                    var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

                    if (now.toDateString() == startDate.toDateString()) {
                        rental.humanStart = 'Today';
                    } else if (yesterday.toDateString() == startDate.toDateString()) {
                        rental.humanStart = 'Yesterday';
                    } else {
                        rental.humanStart = startDate.toLocaleString();
                    }
                }
            });
        }
    };
}]);

angular.module('awesomelib').controller('rentalsController', [
    '$scope', 'rentals', 'Loader', '$location',
    function ($scope, rentals, Loader, $location) {

        function load() {
            Loader.start('rentals');

            rentals.get().then(function (history) {
                var now = new Date();

                $scope.rentals = history.filter(function (rental) {
                    var start = new Date(rental.start);
                    return start.getYear() == now.getYear() && start.getMonth() == now.getMonth();
                });

            }).catch(function (err) {
                if (err.status == 401) {
                    $location.path('/login');
                }
            }).finally(function () {
                Loader.stop('rentals');
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
    '$scope', 'stations', '$routeParams', 'reservation', '$interval', '$location', 'Loader',
    function($scope, stations, $routeParams, reservation, $interval, $location, Loader) {

        function load() {
            Loader.start('station');

            stations.get($routeParams.stationId).then(function(stations) {
                $scope.stations = stations;
                $scope.station = stations[0];

                reservation.pending().then(function(reservations) {
                    if (!reservations.some(function(r) {
                            if (r.station == $scope.station.id && r.status == 'PENDING') {
                                $scope.res = r;
                                return true;
                            }
                        })) {
                        $scope.res = null;
                    }
                });
            }).catch(function(err) {
                if (err.status == 401) {
                    $location.path('/login');
                }
            }).finally(function() {
                Loader.stop('station');
            });
        }

        load();

        $scope.reserve = function(type, stationId) {
            reservation.reserve(type, stationId).then(load);
        };

        $scope.cancel = function() {
            var type = $scope.res.kind.replace('reservation', '');
            reservation.cancel(type, $scope.res.reservation_id).then(load);
        };
    }
]);

angular.module('awesomelib').controller('stationsController', [
    '$scope', 'stations', '$location', 'reservation', 'geoloc', 'Loader', 'info', '$routeParams',
    function($scope, stations, $location, reservation, geoloc, Loader, info) {

        var _stations = null;
        var _reservations = null;

        $scope.favourite = /favourite/.test($location.path());

        function load() {
            Loader.start('stations');

            geoloc.me().catch(function(err) {
                console.warn('Cannot retrieve geolocation.', err);
                return null;
            }).then(function(pos) {
                if ($scope.favourite) {
                    return stations.favourite().then(function(favourites) {
                        return pos ? stations.sortedFrom(favourites, pos) : favourites;
                    });
                } else if (pos) {
                    return reservation.pending().then(function(reservations) {
                        _reservations = reservations;
                        return stations.near(pos);
                    });
                } else {
                    return [];
                }
            }).then(function(filteredStations) {
                _stations = filteredStations;
            }).catch(function(err) {
                if (err.status == 401) {
                    $location.path('/login');
                }
            }).finally(function() {
                $scope.filterStations('car');
                Loader.stop('stations');
            });
        }

        $scope.filterStations = function(type) {
            $scope.type = type;
            $scope.stations = _stations && _stations.filter(function(s) {
                return (s.cars > 0 && type == 'car') ||
                    (s.slots > 0 && type == 'park') || (_reservations && _reservations.some(function(r) {
                        return r.station == s.id && r.status == 'PENDING';
                    }));
            });
        };

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

        return $interval(update, 1000);
    }

    function stopCountDown(countStop) {
        countStop && $interval.cancel(countStop);
    }

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var countStop = null;

            scope.$watch(attrs.alCountDown, function (seconds) {
                if (seconds) {
                    countStop = startCountDown(element, seconds);
                } else {
                    stopCountDown(countStop);
                }
            });

            scope.$on('$destroy', function () {
                stopCountDown(countStop);
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

angular.module('awesomelib').service('geoloc', ['$q', function($q) {
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

            geocoder.geocode({
                'address': address
            }, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var latlng = {
                        lat: results[0].geometry.location.A,
                        lng: results[0].geometry.location.F
                    };
                    console.debug && console.debug('Geocoder.coordOf', address, latlng);
                    defer.resolve(latlng);
                } else {
                    defer.reject('Geocode was not successful for the following reason: ' + status);
                }
            });

            return defer.promise;
        },

        me: function() {
            var defer = $q.defer();

            if (!navigator.geolocation) {
                defer.reject('No geolocation API.');
            } else {
                navigator.geolocation.getCurrentPosition(function(pos) {
                    var me = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    console.debug && console.debug('Me', me);
                    defer.resolve(me);
                }, function(err) {
                    defer.reject(err);
                }, {
                    maximumAge: 0,
                    enableHighAccuracy: true
                });
            }

            return defer.promise;
        },

        unwatch: function(watchId) {
            navigator.geolocation && navigator.geolocation.clearWatch(watchId);
        },

        watchMe: function(callback) {
            if (!callback) {
                throw new Error('No callback defined for geolocation watching.');
            }

            if (!navigator.geolocation) {
                callback('No geolocation API.');
            } else {
                return navigator.geolocation.watchPosition(function(pos) {
                    var me = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    console.debug && console.debug('Me [update]', me);
                    callback(undefined, me);
                }, callback, {
                    maximumAge: 0,
                    enableHighAccuracy: true
                });
            }

        }
    };
}]);

angular.module('awesomelib').directive('alMap', [
    'stations', '$q', 'geoloc', '$location',
    function(stations, $q, geoloc, $location) {

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
            link: function(scope, element, attrs) {

                var map = new google.maps.Map(element[0], {
                    zoom: 16,
                    disableDefaultUI: true
                });
                var directionsRenderer = new google.maps.DirectionsRenderer();
                var directionsService = new google.maps.DirectionsService();

                scope.$watch('zoom', function(zoom) {
                    if (zoom) {
                        map.set('zoom', zoom);
                    }
                });

                var markers = [];

                scope.$watch('stations', function(stations) {
                    markers.forEach(function(m) {
                        m.setMap(null);
                    });
                    markers.length = 0;

                    if (!stations) {
                        return;
                    }

                    stations.forEach(function(station) {
                        var marker = new google.maps.Marker({
                            map: map,
                            position: {
                                lat: station.lat,
                                lng: station.lng
                            },
                            title: station.public_name,
                            icon: 'assets/img/car_orb.png'
                        });

                        google.maps.event.addListener(marker, 'click', function() {
                            scope.$apply(function() {
                                $location.path('/station/' + station.id);
                            });
                        });

                        markers.push(marker);
                    });

                });

                scope.$watch('centerOn', function(center) {
                    google.maps.event.trigger(map, 'resize');

                    if (!center) {
                        return;
                    }

                    ((center.lat && center.lng) ? $q.when(center) : geoloc.coordOf(center))
                    .then(function(latlng) {
                        map.panTo(latlng);
                    });
                });

                scope.$watch('meTo', function(target) {
                    directionsRenderer.setMap(null);
                    if (!target) {
                        return;
                    }

                    geoloc.me().then(function(me) {
                        var start = new google.maps.LatLng(me.lat, me.lng);
                        var end = new google.maps.LatLng(target.lat, target.lng);
                        var request = {
                            origin: start,
                            destination: end,
                            travelMode: google.maps.TravelMode.WALKING
                        };
                        directionsService.route(request, function(directions, status) {
                            if (status == google.maps.DirectionsStatus.OK) {
                                directionsRenderer.setMap(map);
                                directionsRenderer.setDirections(directions);
                                map.set('zoom', 17);
                            }
                        });
                    });

                });

                var watchId = geoloc.watchMe(function(me) {
                    displayMe(map, me);

                    if (scope.followMe) {
                        map && map.panTo(me);
                    }
                });

                scope.$on('$destroy', function() {
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
    function($http, $q, geoloc) {
        return {
            all: function() {
                return $http.get('/api/v2/station').then(function(resp) {
                    console.debug && console.debug('[HTTP] Stations ->', resp.data.results.length);
                    return resp.data.results;
                });
            },
            get: function(stationId) {
                return $http.get('/api/v2/station/' + encodeURIComponent(stationId)).then(function(resp) {
                    console.debug && console.debug('[HTTP] Station', stationId, '->', resp.data.results.length);
                    return resp.data.results;
                });
            },
            near: function(loc, filter) {
                var _this = this;
                filter = filter || function(s) {
                    return s.cars > 0 || s.slots > 0;
                };

                return ((loc.lat && loc.lng) ? $q.when(loc) : geoloc.coordOf(loc))
                    .then(function(latlng) {
                        loc = latlng;
                        return _this.all();
                    })
                    .then(function(_stations) {
                        _stations = _stations.filter(filter);

                        var nearest = _this.sortedFrom(_stations, loc).slice(0, 10);
                        console.debug && console.debug('Near', loc, nearest);

                        return nearest;
                    });
            },
            favourite: function() {
                var _this = this;

                return $http.get('/api/v2/favourite').then(function(resp) {
                    console.debug && console.debug('[HTTP] Favourites ->', resp.data.results.length);
                    var stationIds = resp.data.results.map(function(s) {
                        return s.id
                    }).join(',');
                    return _this.get(stationIds);
                });
            },
            sortedFrom: function(stations, loc) {
                var _stations = stations.map(function(s) {
                    return (s.distance = Math.round(0.01 * geoloc.distance(s, loc)) / 10) && s;
                });

                _stations.sort(function(s1, s2) {
                    return s1.distance < s2.distance ? -1 : 1;
                });

                return _stations;
            }
        };
    }
]);

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
