angular.module('awesomelib').directive('alRentalCard', [function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/rentals/rentalCard.html',
        scope: {
            rental: '='
        },
        link: function(scope) {
            scope.$watch('rental', function(rental) {
                if (rental) {
                    var startDate = new Date(rental.start);
                    var now = new Date();
                    var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

                    if (now.toDateString() == startDate.toDateString()) {
                        rental.humanStart = 'Today';
                    } else if (yesterday.toDateString() == startDate.toDateString()) {
                        rental.humanStart = 'Yesterday';
                    } else {
                        rental.humanStart = startDate.toLocaleString();
                    }
                }
            });
        }
    };
}]);
