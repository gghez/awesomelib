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
