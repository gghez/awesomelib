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

  $routeProvider.otherwise({
    redirectTo: '/'
  });
}]);

angular.module('awesomelib').controller('homeController', [
  '$scope', 'usage', '$window', '$location', 'car',
  function($scope, usage, $window, $location, car) {

    $scope.Math = $window.Math;

    usage.get().then(function(u) {
      $scope.usage = u;
      $scope.usage.diff = u.cur - u.prev;
    }).catch(function() {
      $location.path('/login');
    });

    car.pending().then(function(reservations) {
      $scope.reservations = reservations;
    });

    $scope.cancel = function() {
      $window.alert('Not implemented yet.');
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

angular.module('awesomelib').service('rentals', ['$http', function($http) {
  return {
    get: function() {
      return $http.get('/rest/rentals').then(function(resp) {
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
