angular.module('awesomelib').controller('billsController', [
    '$scope', 'bills', 'Loader', '$location',
    function ($scope, bills, Loader, $location) {

        function load() {
            Loader.start('bills');

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
            }).catch(function(err){
               if (err.status == 401){
                   $location.path('/login');
               }
            }).finally(function(){
                Loader.stop('bills');
            });
        }

        load();

    }
]);
