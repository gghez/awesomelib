angular.module('awesomelib', ['ng', 'ngRoute']);

angular.module('awesomelib').config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'app/components/home/home.html',
    controller: 'homeController'
  });

  $routeProvider.otherwise({
    redirectTo: '/'
  });
}]);
