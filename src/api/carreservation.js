var http = require('./http-helper');

module.exports = function(stationId, subscriberId, token) {
  return http.post('/v2/reservation/', {
    station: stationId,
    kind: 'carreservation',
    subscriber_id: subscriberId,
    car_category: 'bluecar'
  }, {
    'Authorization': 'Bearer ' + token
  });
};
