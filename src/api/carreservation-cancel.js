var http = require('./http-helper');

module.exports = function(reservationId, token) {
  return http.delete('/v2/carreservation/' + reservationId + '/', {
    'Authorization': 'Bearer ' + token
  });
};
