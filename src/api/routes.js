var router = require('express').Router();
var bodyParser = require('body-parser');

var alert = require('./alert');
var bill = require('./bill');
var carCategory = require('./carcategory');
var carReservationCancel = require('./carreservation-cancel');
var carReservationMeta = require('./carreservation-meta');
var carReservation = require('./carreservation');
var chargesHistory = require('./chargeshistory');
var customerInformation = require('./customerinformation');
var favourite = require('./favourite');
var oauth2 = require('./oauth2');
var offer = require('./offer');
var parkReservationCancel = require('./parkreservation-cancel');
var parkReservationMeta = require('./parkreservation-meta');
var parkReservation = require('./parkreservation');
var rentalsHistory = require('./rentalshistory');
var reservation = require('./reservation');
var station = require('./station');
var subscription = require('./subscription');

router.post('/oauth2', bodyParser.json(), function(req, res, next) {
  var creds = req.body;
  oauth2(creds.username, creds.password)
    .then(function(data) {
      res.header('Set-Cookie', 'al-token=' + data.access_token);
      res.send(data);
    }).catch(next);
});

router.use(function(req, res, next) {
  var cookie = req.header('Cookie');
  var token = req.header('al-token');

  if (token) {
    req.token = token;
    next();
  } else if (!cookie || !cookie.split(';').some(function(pair) {
      var splt = pair.split('=');
      if (splt[0].trim() == 'al-token') {
        req.token = splt[1].trim();
        next();
        return true;
      }
    })) {
    res.sendStatus(401);
  }
});

// Following routes context is authenticated

router.get('/alert', function(req, res, next) {
  alert(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/bill', function(req, res, next) {
  bill(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/carcategory', function(req, res, next) {
  carCategory(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.delete('/carreservation-cancel/:reservationId', function(req, res, next) {
  carReservationCancel(req.params.reservationId, req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/carreservation-meta', function(req, res, next) {
  carReservationMeta(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.post('/carreservation', bodyParser.json(), function(req, res, next) {
  var data = req.body;
  carReservation(data.stationId, data.subscriberId, req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/chargeshistory', function(req, res, next) {
  chargesHistory(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/customerinformation', function(req, res, next) {
  customerInformation(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/favourite', function(req, res, next) {
  favourite(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/offer', function(req, res, next) {
  offer(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.delete('/parkreservation-cancel/:reservationId', function(req, res, next) {
  parkReservationCancel(req.params.reservationId, req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/parkreservation-meta', function(req, res, next) {
  parkReservationMeta(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.post('/parkreservation', bodyParser.json(), function(req, res, next) {
  var data = req.body;
  parkReservation(data.stationId, data.subscriberId, req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/rentalshistory', function(req, res, next) {
  rentalsHistory(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/reservation', function(req, res, next) {
  reservation(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/station', function(req, res, next) {
  station('', req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/station/:stationIds', function(req, res, next) {
  station(req.params.stationIds, req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

router.get('/subscription', function(req, res, next) {
  subscription(req.token).then(function(data) {
    res.send(data);
  }).catch(next);
});

module.exports = router;
