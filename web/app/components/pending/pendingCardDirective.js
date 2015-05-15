angular.module('awesomelib').directive('alPendingCard', [function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/pending/pendingCard.html',
        scope: {
            reservation: '='
        },
        controller: ['$scope', 'reservation', function($scope, reservation) {
            /*$scope.$watch('reservation', function(res) {
                if (res) {
                    var date = new Date(res.created_at);
                    var now = new Date();
                    if (now.toDateString() == date.toDateString()) {
                        res.humanDate = 'Today';
                    } else {
                        res.humanDate = date.toLocaleString();
                    }
                }
            });*/

            $scope.cancel = function() {
                reservation.cancel($scope.reservation.kind.replace('reservation', ''), $scope.reservation.reservation_id).then(function() {
                    return reservation.pending();
                }).then(function(_reservations) {
                    _reservations.some(function(r) {
                        if (r.reservation_id == $scope.reservation.reservation_id) {
                            $scope.reservation.status = r.status;
                            return true;
                        }
                    });
                });
            };

        }]
    };
}]);
