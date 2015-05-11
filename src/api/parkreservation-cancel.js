var http = require('./http-helper');

module.exports = function(reservationId, token) {
  return http.delete('/v2/parkreservation/' + reservationId + '/', {
    'Authorization': 'Bearer ' + token
  });
};
