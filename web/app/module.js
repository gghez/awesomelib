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
