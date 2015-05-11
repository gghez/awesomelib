var router = require('express').Router();
var Q = require('q');
var stations = require('../stations');
var bodyParser = require('body-parser');

function increase(station, req) {
  return stations.near({
    cookies: req.user.cookies,
    debug: req.debug,
    address: station.address
  }).then(function(_stations) {
    var was = {
      hrid: station.hrid,
      cars: station.cars,
      parks: station.parks
    };
    // Update station
    _stations.forEach(function(s) {
      if (s.address == station.address) {
        station.hrid = s.hrid;
        if (s.type == 'car') station.cars = s.available;
        if (s.type == 'park') station.parks = s.available;
      }
    });

    req.debug && console.log('Was', was, 'Is', {
      hrid: station.hrid,
      cars: station.cars,
      parks: station.parks
    });

    // Save updated station
    return Q.nbind(req.stationsCollection.update, req.stationsCollection)({
      station_id: station.station_id
    }, {
      $set: {
        hrid: station.hrid,
        parks: station.parks,
        cars: station.cars
      }
    });

  }).then(function() {
    return station;
  });
}

// Save stations mongo collection in current request
router.use(function(req, res, next) {
  req.stationsCollection = req.app.get('db').collection('stations');
  next();
});

// Load station by its ID if route contains one
router.param('id', function(req, res, next, stationId) {
  if (!isNaN(stationId)) {
    req.debug && console.log('Find station', stationId);
    req.stationsCollection.find({
      station_id: Number(stationId)
    }).toArray(function(err, docs) {
      if (err) {
        next(err);
      } else if (docs && docs.length) {
        req.station = docs[0];
        req.debug && console.log('Station found', stationId, req.station.name);
        next();
      } else {
        res.sendStatus(404);
      }
    });
  } else {
    next();
  }
});

// Get stations near specified address
router.get('/near/:type/:address', function(req, res, next) {
  stations.near({
    type: req.params.type,
    address: req.params.address,
    cookies: req.user.cookies,
    debug: req.app.get('debug')
  }).then(function(stations) {
    res.send(stations);
  }).catch(next);
});

// Update stations mongo collection
router.get('/update', function(req, res, next) {
  stations.all({
    cookies: req.user.cookies,
    debug: req.app.get('debug')
  }).then(function(stations) {
    var updates = stations.map(function(station) {
      return Q.nbind(req.stationsCollection.update, req.stationsCollection)({
        station_id: station.station_id
      }, {
        $set: station
      }).then(function(result) {
        if (!result.result.n) {
          return Q.nbind(req.stationsCollection.insert, req.stationsCollection)(station);
        }
      });
    });

    Q.all(updates).then(function(results) {
      res.send({
        updated: results.length
      });
    }).catch(next);
  }).catch(next);

});

// Get all stations from mongo collection
router.get('/', function(req, res, next) {
  req.stationsCollection.find({}).toArray(function(err, docs) {
    if (err) {
      next(err);
    } else {
      res.send(docs);
    }
  });
});

// Get all stations that have a short name
router.get('/shortcuts', function(req, res, next) {
  var userStationIds =
    ((req.user.shortcuts && Object.keys(req.user.shortcuts)) || []).map(function(shortName) {
      return req.user.shortcuts[shortName];
    });

  req.stationsCollection.find({
    station_id: {
      $in: userStationIds
    }
  }).toArray(function(err, docs) {
    if (err) {
      next(err);
    } else {
      req.stations = docs;
      next();
    }
  });
});

router.post('/shortcuts', bodyParser.json(), function(req, res, next) {
  var shortcut = req.body;

  if (!req.user.shortcuts) {
    req.user.shortcuts = {};
  }

  req.user.shortcuts[shortcut.name] = shortcut.station_id;

  var usersColl = req.app.get('db').collection('users');
  Q.nbind(usersColl.update, usersColl)({
    username: req.user.username
  }, {
    $set: {
      shortcuts: req.user.shortcuts
    }
  }).then(function(result) {
    if (result.result.n) {
      res.sendStatus(201);
    } else {
      res.sendStatus(404);
    }
  }).catch(next);
});

router.delete('/shortcuts/:name', function(req, res, next) {
  if (req.user.shortcuts && req.user.shortcuts[req.params.name] !== undefined) {
    delete req.user.shortcuts[req.params.name];

    var usersColl = req.app.get('db').collection('users');
    Q.nbind(usersColl.update, usersColl)({
      username: req.user.username
    }, {
      $set: {
        shortcuts: req.user.shortcuts
      }
    }).then(function(result) {
      if (result.result.n) {
        res.sendStatus(204);
      } else {
        res.sendStatus(404);
      }
    }).catch(next);
  } else {
    res.sendStatus(404);
  }
});

// Get station by its ID
router.get('/:id', function(req, res, next) {
  next();
});

// Get stations by their name
router.get('/name/:name', function(req, res, next) {
  req.stationsCollection.find({
    name: new RegExp(req.params.name, 'i')
  }).toArray(function(err, docs) {
    if (err) {
      next(err);
    } else {
      req.stations = docs;
      next();
    }
  });
});

// Get stations by their address
router.get('/address/:address', function(req, res, next) {
  req.stationsCollection.find({
    address: new RegExp(req.params.address, 'i')
  }).toArray(function(err, docs) {
    if (err) {
      next(err);
    } else {
      req.stations = docs;
      next();
    }
  });
});

// Update station partially in mongo collection
router.put('/:id', bodyParser.json(), function(req, res, next) {
  var update = req.body;

  Q.nbind(req.stationsCollection.update, req.stationsCollection)({
    station_id: Number(req.params.id)
  }, {
    $set: update
  }).then(function(result) {
    if (result.result.n) {
      res.sendStatus(204);
    } else {
      next('Unable to update station data.');
    }
  }).catch(next);
});

// Increase and send station data
router.use(function(req, res, next) {
  if (req.station) {
    increase(req.station, req).then(res.send.bind(res));
  } else if (req.stations) {
    Q.all(req.stations.map(function(s) {
      return increase(s, req);
    })).then(res.send.bind(res));
  } else {
    next();
  }
});


module.exports = router;
