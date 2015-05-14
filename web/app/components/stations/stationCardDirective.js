angular.module('awesomelib').directive('alStationCard', [function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/stations/stationCard.html',
        scope: {
            station: '='
        },
        controller: ['$scope', 'reservation', function ($scope, reservation) {
            function update() {
                $scope.res = null;
                reservation.pending().then(function (reservations) {
                    reservations.some(function (r) {
                        if (r.station == $scope.station.id && r.status == 'PENDING') {
                            $scope.res = r;
                            return true;
                        }
                    });
                });
            }

            $scope.$watch('station', function (station) {
                if (station) {
                    update();
                }
            });

            $scope.reserve = function (type, stationId) {
                reservation.reserve(type, stationId).then(function (res) {
                    $scope.res = res;
                });
            };

            $scope.cancel = function () {
                var type = $scope.res.kind.replace('reservation', '');
                reservation.cancel(type, $scope.res.reservation_id).then(update);
            };
        }]
    };
}]);
