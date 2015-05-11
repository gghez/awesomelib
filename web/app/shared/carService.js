angular.module('awesomelib').service('car', [
  '$http', 'stations',
  function($http, stations) {
    return {
      pending: function() {
        return $http.get('/rest/car/pending').then(function(resp) {
          return resp.data;
        });
      },
      reserveByName: function(type, stationName) {
        var _this = this;
        console.info && console.info('Reserve', type, stationName);

        return stations.all().then(function(allStations) {

          var stationAddress = null;
          if (allStations.some(function(s) { // Find station address
              if (s.name.toLowerCase() == stationName.toLowerCase()) { // Station name found
                stationAddress = s.address;
                console.debug && console.debug('Address found', s.address);
                return true;
              }
            })) {

            return stations.near(type, stationAddress).then(function(nStations) { // Find stations HRID
              var hrId = null;
              if (nStations.some(function(s) { // Station name found
                  if (s.name.toLowerCase() == stationName.toLowerCase()) {
                    hrId = s.hrid;
                    console.debug && console.debug('HRID found', s.hrid);
                    return true;
                  }
                })) {

                return _this.reserve(type, hrId);
              } else {
                console.warn && console.warn('HRID not found.');
              }
            });
          } else {
            console.warn && console.warn('Station not found', stationName);
          }

        });

      },
      reserve: function(type, hrid) {
        return $http.get('/rest/car/reserve/' + encodeURIComponent(type) + '/' + encodeURIComponent(hrid)).then(function(resp) {
          console.info && console.info('Reserved', resp.data);
          return resp.data;
        });
      },
      cancel: function(type, reservationId) {
        return $http.get('/rest/car/cancel/' + encodeURIComponent(type) + '/' + encodeURIComponent(reservationId)).then(function() {
          console.info && console.info('Canceled', reservationId);
        });
      }
    };
  }
]);
