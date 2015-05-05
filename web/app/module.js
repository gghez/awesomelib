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
