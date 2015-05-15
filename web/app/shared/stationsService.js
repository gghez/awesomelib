angular.module('awesomelib').service('stations', [
    '$http', '$q', 'geoloc',
    function($http, $q, geoloc) {
        return {
            all: function() {
                return $http.get('/api/v2/station').then(function(resp) {
                    console.debug && console.debug('[HTTP] Stations ->', resp.data.results.length);
                    return resp.data.results;
                });
            },
            get: function(stationId) {
                return $http.get('/api/v2/station/' + encodeURIComponent(stationId)).then(function(resp) {
                    console.debug && console.debug('[HTTP] Station', stationId, '->', resp.data.results.length);
                    return resp.data.results;
                });
            },
            near: function(loc, filter) {
                var _this = this;
                filter = filter || function(s) {
                    return s.cars > 0 || s.slots > 0;
                };

                return ((loc.lat && loc.lng) ? $q.when(loc) : geoloc.coordOf(loc))
                    .then(function(latlng) {
                        loc = latlng;
                        return _this.all();
                    })
                    .then(function(_stations) {
                        _stations = _stations.filter(filter);

                        var nearest = _this.sortedFrom(_stations, loc).slice(0, 10);
                        console.debug && console.debug('Near', loc, nearest);

                        return nearest;
                    });
            },
            favourite: function() {
                var _this = this;

                return $http.get('/api/v2/favourite').then(function(resp) {
                    console.debug && console.debug('[HTTP] Favourites ->', resp.data.results.length);
                    var stationIds = resp.data.results.map(function(s) {
                        return s.id
                    }).join(',');
                    return _this.get(stationIds);
                });
            },
            sortedFrom: function(stations, loc) {
                var _stations = stations.map(function(s) {
                    return (s.distance = Math.round(0.01 * geoloc.distance(s, loc)) / 10) && s;
                });

                _stations.sort(function(s1, s2) {
                    return s1.distance < s2.distance ? -1 : 1;
                });

                return _stations;
            }
        };
    }
]);
