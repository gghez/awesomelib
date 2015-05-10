var router = require('express').Router();
var Q = require('q');
var stations = require('../stations');

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

router.get('/update', function(req, res, next) {
  var collection = req.app.get('db').collection('stations');

  stations.all({
    cookies: req.user.cookies,
    debug: req.app.get('debug')
  }).then(function(stations) {
    var updates = stations.map(function(station) {
      return Q.nbind(collection.update, collection)({
        station_id: station.station_id
      }, {
        $set: station
      });
    });

    Q.all(updates).then(function(results) {
      res.send({
        updated: results.length
      });
    }).catch(next);
  }).catch(next);

});

router.get('/', function(req, res, next) {
  var collection = req.app.get('db').collection('stations');

  collection.find({}).toArray(function(err, docs) {
    if (err) {
      next(err);
    } else {
      res.send(docs);
    }
  });
});

router.get('/:id', function(req, res, next) {
  var collection = req.app.get('db').collection('stations');

  collection.find({
    station_id: Number(req.params.id)
  }).toArray(function(err, docs) {
    if (err) {
      next(err);
    } else if (docs && docs.length) {
      res.send(docs[0]);
    } else {
      res.sendStatus(404);
    }
  });
});

router.get('/address/:address', function(req, res, next) {
  var collection = req.app.get('db').collection('stations');

  collection.find({
    address: new RegExp(req.params.address, 'i')
  }).toArray(function(err, docs) {
    if (err) {
      next(err);
    } else {
      res.send(docs);
    }
  });
});


module.exports = router;
