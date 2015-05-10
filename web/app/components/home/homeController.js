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
