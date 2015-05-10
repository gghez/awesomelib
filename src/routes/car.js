var router = require('express').Router();
var Q = require('q');
var car = require('../car');

router.get('/reserve/:stationId', function(req, res, next) {
  car.reserve({
    stationId: req.params.stationId,
    cookies: req.user.cookies,
    debug: req.app.get('debug')
  }).then(function(status) {
    res.send(status);
  }).catch(next);

});

router.get('/cancel/:reservation', function(req, res, next) {
  car.cancel({
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
