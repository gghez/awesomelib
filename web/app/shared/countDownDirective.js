angular.module('awesomelib').directive('alCountDown', ['$interval', function ($interval) {

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

        return $interval(update, 1000);
    }

    function stopCountDown(countStop) {
        countStop && $interval.cancel(countStop);
    }

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var countStop = null;

            scope.$watch(attrs.alCountDown, function (seconds) {
                if (seconds) {
                    countStop = startCountDown(element, seconds);
                } else {
                    stopCountDown(countStop);
                }
            });

            scope.$on('$destroy', function () {
                stopCountDown(countStop);
            });
        }
    }

}]);
