angular.module('awesomelib').controller('loginController', ['$scope', 'login', '$location', function($scope, login, $location){

  $scope.login = function(){
    login.authenticate($scope.username, $scope.password).then(function(auth){
      $location.path('/status');
    }).catch(function(resp){
      $scope.error = resp.data;
    });
  };

}]);
