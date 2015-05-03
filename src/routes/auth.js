var router = require('express').Router();
var bodyParser = require('body-parser');
var login = require('../login');
var crypto = require('crypto');
var utils = require('../utils');

router.use(function(req, res, next) {
  var cookies = utils.cookiesContainer(req.header('Cookie'));
  var token = req.header('AL-TOKEN') || cookies['AL-TOKEN'];

  if (token) {
    var users = req.app.get('db').collection('users');

    users.find({
      token: token
    }).toArray(function(err, docs) {
      if (err) {
        next(err);
      } else if (docs && docs.length) {
        req.user = docs[0];
        delete req.user._id;
        next();
      }
    });
  } else {
    next();
  }
});

router.post('/auth', bodyParser.json(), function(req, res, next) {
  var creds = req.body;

  var users = req.app.get('db').collection('users');

  login(creds).then(function(cookies) {
    var shasum = crypto.createHash('sha1');
    shasum.update(new Date().toString());
    var token = shasum.digest('hex');

    users.update({
      username: creds.username
    }, {
      $set: {
        cookies: cookies,
        token: token
      }
    }, function(err, result) {
      if (err) {
        next(err);
      } else if (result.result.n) {
        res.send({
          token: token
        });
      } else {
        users.insert({
          username: creds.username,
          cookies: cookies,
          token: token
        }, function(err, result) {
          if (err) {
            next(err);
          } else if (result.result.n) {
            res.send({
              token: token
            });
          } else {
            next('Cannot register authenficated user to database.');
          }
        });
      }
    });
  }).catch(next);
});

router.use(function(req, res, next) {
  if (!req.user) {
    res.sendStatus(401);
  } else {
    next();
  }
});

module.exports = router;
