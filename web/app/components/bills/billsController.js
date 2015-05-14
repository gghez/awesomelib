angular.module('awesomelib').controller('billsController', [
    '$scope', 'bills',
    function ($scope, bills) {

        function load() {
            bills.get().then(function (bills) {

                var total = 0;
                bills.forEach(function (b) {
                    b.due_date = new Date(b.due_date);
                    b.issue_date = new Date(b.issue_date);

                    total += b.amount_net;
                });

                $scope.beginning = new Date(bills[bills.length - 1].issue_date);

                $scope.total_amount = total;
                $scope.bills = bills;
            });
        }

        load();

    }
]);
