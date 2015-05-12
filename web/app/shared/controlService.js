angular.module('awesomelib').service('control', [
    '$http',
    function ($http) {
        return {
            version: function () {
                return $http.get('/api/version').then(function (resp) {
                    return resp.data.version;
                });
            }
        };
    }
]);
