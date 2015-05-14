angular.module('awesomelib').directive('alCountDown', ['$interval', function ($interval) {

    var countStop = null;

    function startCountDown(element, seconds) {
        stopCountDown();

        var countDown = seconds;

        function update() {
            var hours = Math.floor(--countDown / 3600);
            var minutes = Math.floor((countDown % 3600) / 60);
            var seconds = countDown % 60;

            var display = (hours < 10 ? '0' : '') + hours + ':' +
                (minutes < 10 ? '0' : '') + minutes + ':' +
                (seconds < 10 ? '0' : '') + seconds;

            element.text(display);
        }

        update();

        countStop = $interval(update, 1000);
    }

    function stopCountDown() {
        countStop && $interval.cancel(countStop);
    }

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            scope.$watch(attrs.alCountDown, function (seconds) {
                if (seconds) {
                    startCountDown(element, seconds);
                } else {
                    stopCountDown();
                }
            });

            scope.$on('$destroy', function () {
                stopCountDown();
            });
        }
    }

}]);
