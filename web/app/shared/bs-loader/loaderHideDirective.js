angular.module('bsLoader').directive('bsLoaderHide', ['Loader', function (Loader) {

    return {
        restrict: 'A',
        link: function (scope, element) {
            function onLoadingStateChanged(loading) {
                if (loading) {
                    element.addClass('ng-hide');
                } else {
                    element.removeClass('ng-hide');
                }
            }

            Loader.register(onLoadingStateChanged);

            scope.$on('$destroy', function () {
                Loader.unregister(onLoadingStateChanged);
            });
        }
    };

}]);
