angular.module('awesomelib').service('geocalcul', [function() {

  function radians(num) {
    return num * Math.PI / 180;
  }

  function distance(pos1, pos2) {
    var R = 6371000; // metres
    var φ1 = radians(pos1.lat);
    var φ2 = radians(pos2.lat);
    var Δφ = radians(pos2.lat - pos1.lat);
    var Δλ = radians(pos2.lng - pos1.lng);

    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  return {
    radians: radians,
    distance: distance
  };

}]);
