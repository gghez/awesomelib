angular.module('awesomelib').controller('homeController', ['$scope', 'usage', function($scope, usage) {

  usage.get().then(function(u) {
    $scope.usage = u;
  });

}]);
