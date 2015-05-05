var express = require('express');
var mongodb = require('mongodb');
var morgan = require('morgan');

var app = express();

app.use(morgan('common'));

app.use('/assets/libs/', express.static(__dirname + '/../node_modules/'));
app.use('/', express.static(__dirname + '/../web/'));

app.use('/rest/', require('./routes/auth'));
app.use('/rest/rentals', require('./routes/rentals'));
app.use('/rest/usage', require('./routes/usage'));
app.use('/rest/stations', require('./routes/stations'));

app.get('/rest/status', function(req, res, next) {
  res.send({
    user: req.user
  });
});

app.use(function(req, res, next) {
  res.sendStatus(404);
});

app.use(function(err, req, res, next) {
  if (err instanceof Error) {
    console.error(err.stack);
  } else {
    console.error(err);
  }

  res.status(500).send(err);
});

module.exports.run = function(options) {
  app.set('debug', options.debug);

  mongodb.MongoClient.connect('mongodb://localhost:27017/autolib', function(err, db) {
    if (err) {
      console.error('Failed to connect database.', err);
    } else {
      app.set('db', db);
      var port = process.env.PORT || 3788;
      app.listen(port, function() {
        console.log('Application running on port', port);
      });
    }
  });

};
