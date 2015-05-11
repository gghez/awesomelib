angular.module('awesomelib').service('geocoder', ['$q', function($q) {
  var geocoder = new google.maps.Geocoder();

  return {
    addressOf: function(latlng) {
      var defer = $q.defer();

      console.debug && console.debug('Geocoder.addressOf', latlng);
      geocoder.geocode({
        'latLng': latlng
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[1]) {
            console.debug && console.debug('=>', results[1].formatted_address);
            defer.resolve(results[1].formatted_address);
          } else {
            defer.reject('No address found.');
          }
        } else {
          defer.reject('Geocoder failed due to: ' + status);
        }
      });

      return defer.promise;
    },

    coordOf: function(address) {
      var defer = $q.defer();

      console.debug && console.debug('Geocoder.coordOf', address);

      geocoder.geocode({
        'address': address
      }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          console.debug && console.debug('=>', results[0].geometry.location);
          defer.resolve(results[0].geometry.location);
        } else {
          defer.reject('Geocode was not successful for the following reason: ' + status);
        }
      });

      return defer.promise;
    }
  };
}]);
