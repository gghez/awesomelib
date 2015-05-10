var router = require('express').Router();
var Q = require('q');
var car = require('../car');

router.get('/reserve/:type/:stationId', function(req, res, next) {
  car.reserve({
    type: req.params.type,
    stationId: req.params.stationId,
    cookies: req.user.cookies,
    debug: req.app.get('debug')
  }).then(function(status) {
    res.send(status);
  }).catch(next);

});

router.get('/cancel/:type/:reservation', function(req, res, next) {
  car.cancel({
    type: req.params.type,
    reservationId: req.params.reservation,
    cookies: req.user.cookies,
    debug: req.app.get('debug')
  }).then(function() {
    res.sendStatus(204);
  }).catch(next);
});

router.get('/pending', function(req, res, next) {
  car.pending({
    cookies: req.user.cookies,
    debug: req.app.get('debug')
  }).then(function(reservations) {
    res.send(reservations);
  }).catch(next);
});

module.exports = router;
