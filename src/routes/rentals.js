var router = require('express').Router();
var Q = require('q');
var rentals = require('../rentals');

router.get('/', function(req, res, next) {

  rentals({
    cookies: req.user.cookies,
    debug: req.app.get('debug')
  }).then(function(rentals) {
    res.send(rentals);
  }).catch(next);

});

module.exports = router;
