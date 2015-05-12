angular.module('awesomelib').service('info', [
    '$http',
    function ($http) {
        return {
            get: function () {
                return $http.get('/api/v2/customerinformation').then(function (resp) {
                    return resp.data;
                });
            }
        };
    }
]);
