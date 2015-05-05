var router = require('express').Router();
var Q = require('q');
var rentals = require('../rentals');

router.get('/', function(req, res, next) {
  var now = new Date();
  var d = new Date(now.getFullYear(), now.getMonth(), 0);
  var prevStart = (d.getMonth() + 1) + '/01/' + d.getFullYear();
  var prevEnd = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();

  Q.all([rentals({
      start: prevStart,
      end: prevEnd,
      cookies: req.user.cookies,
      debug: req.app.get('debug')
    }), rentals({
      cookies: req.user.cookies,
      debug: req.app.get('debug')
    })])
    .spread(function(prevRentals, rentals) {
      var usage = Math.round(100 * rentals.reduce(function(prev, cur) {
        return prev + cur.amount;
      }, 0)) / 100;

      var prevUsage = Math.round(100 * prevRentals.reduce(function(prev, cur) {
        return prev + cur.amount;
      }, 0)) / 100;

      res.send({
        prev: prevUsage,
        cur: usage
      });
    })
    .catch(next);
});

module.exports = router;
