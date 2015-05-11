angular.module('bsLoader').directive('bsLoader', ['Loader', '$timeout', function (Loader, $timeout) {

    var DEFAULT_LOADER_TEXT = 'Loading...';

    return {
        template: '<div ng-show="loading"><span class="bs-loader glyphicon glyphicon-refresh"></span> ' +
        '<span class="bs-loader-text" ng-bind="loaderText"></span></div>',
        replace: true,
        restrict: 'E',
        scope: {},
        link: function (scope) {
            var timer = null;

            function onLoadingStateChanged(loading, text) {
                scope.$evalAsync(function () {
                    if (loading) {
                        timer && $timeout.cancel(timer);
                        scope.loading = loading;
                        scope.loaderText = text || DEFAULT_LOADER_TEXT;
                    } else {
                        timer = $timeout(function () {
                            scope.loading = false;
                        }, 500);
                    }
                });
            }

            Loader.register(onLoadingStateChanged);

            scope.$on('$destroy', function () {
                Loader.unregister(onLoadingStateChanged);
            });
        }
    };

}]);
