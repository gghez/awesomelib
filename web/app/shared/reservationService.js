angular.module('awesomelib').service('reservation', [
  '$http', 'subscription',
  function($http, subscription) {
    return {
      pending: function() {
        return $http.get('/api/v2/reservation').then(function(resp) {
          return resp.data.results;
        });
      },
      reserve: function(type, stationId) {
        return subscription.get().then(function(subscriptions) {
          return $http.post('/api/v2/' + type + 'reservation', {
            stationId: stationId,
            subscriberId: subscriptions[0].subscriber_id
          });
        }).then(function(resp) {
          console.info && console.info('Reserved', resp.data);
          return resp.data;
        });;
      },
      cancel: function(type, reservationId) {
        return $http.delete('/api/v2/' + type + 'reservation-cancel/' + reservationId).then(function() {
          console.info && console.info('Canceled', reservationId);
        });
      }
    };
  }
]);
