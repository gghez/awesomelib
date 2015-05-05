var router = require('express').Router();
var Q = require('q');
var stations = require('../stations');

router.get('/near/:address', function(req, res, next) {
  stations.near({
    address: req.params.address,
    cookies: req.user.cookies,
    debug: req.app.get('debug')
  }).then(function(stations) {
    res.send(stations);
  }).catch(next);
});

module.exports = router;
