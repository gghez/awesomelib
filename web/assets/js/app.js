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
  '$scope', 'car',
  function($scope, car) {

    car.pending().then(function(reservations) {
      $scope.reservations = reservations;
    });

    $scope.cancel = function() {
      $window.alert('Not implemented yet.');
    };
  }
]);

angular.module('awesomelib').controller('rentalsController', ['$scope', 'rentals', function($scope, rentals) {

  rentals.get().then(function(rentals) {
    $scope.rentals = rentals;
  });

}]);

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

angular.module('awesomelib').service('car', ['$http', function($http) {
  return {
    pending: function() {
      return $http.get('/rest/car/pending').then(function(resp) {
        return resp.data;
      });
    }
  };
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

angular.module('awesomelib').directive('alMap', ['stations', '$q', function(stations, $q) {

  return {
    restrict: 'E',
    template: '<div id="map-canvas" class="al-map"></div>',
    replace: true,
    link: function(scope, element, attrs) {

      var map, // Map
        me, // LatLng
        markerMe, // Marker
        geocoder = new google.maps.Geocoder(),
        sMarks = []; // Stations markers

      function initialize() {
        console.log('Initialize called.');
        var mapOptions = {
          zoom: 15
        };
        map = new google.maps.Map(element[0], mapOptions);
      }

      initialize();

      function addressOfMe() {
        var defer = $q.defer();

        geocoder.geocode({
          'latLng': me
        }, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (results[1]) {
              defer.resolve(results[1].formatted_address);
            } else {
              defer.reject('No address found.');
            }
          } else {
            defer.reject('Geocoder failed due to: ' + status);
          }
        });

        return defer.promise;
      }

      navigator.geolocation.watchPosition(function(position) {
        me = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        if (markerMe) markerMe.setMap(null);

        markerMe = new google.maps.Marker({
          position: me,
          map: map,
          title: "You are here!"
        });

        map && map.panTo(me);

        addressOfMe().then(function(address) {
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

    }
  };

}]);

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
    near: function(address) {
      return $http.get('/rest/stations/near/' + address).then(function(resp) {
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
