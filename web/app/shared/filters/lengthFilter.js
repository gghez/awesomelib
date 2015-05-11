angular.module('awesomelib').filter('length', [function() {
  return function(arr) {
    return (arr && arr.length) || 0;
  }
}]);
