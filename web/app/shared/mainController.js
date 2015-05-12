angular.module('awesomelib').controller('mainController', [
    '$scope', 'control',
    function ($scope, control) {

        control.version().then(function (version) {
            $scope.version = version;
        });

    }
]);
