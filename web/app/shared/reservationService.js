angular.module('awesomelib').service('reservation', [
    '$http', 'subscription', '$q', '$timeout',
    function ($http, subscription, $q, $timeout) {
        return {
            pending: function () {
                return $http.get('/api/v2/reservation').then(function (resp) {
                    return pendings = resp.data.results;
                });
            },
            reserve: function (type, stationId) {
                return subscription.get().then(function (subscriptions) {
                    return $http.post('/api/v2/' + type + 'reservation', {
                        stationId: stationId,
                        subscriberId: subscriptions[0].subscriber_id
                    });
                }).then(function (resp) {
                    console.info && console.info(type, 'reserved', resp.data);
                    return resp.data;
                });
                ;
            },
            cancel: function (type, reservationId) {
                return $http.delete('/api/v2/' + type + 'reservation-cancel/' + reservationId).then(function () {
                    console.info && console.info(type, 'canceled', reservationId);
                });
            }
        };
    }
]);
