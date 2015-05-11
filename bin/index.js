#!/usr/bin/env node

var express = require('express');
var mongodb = require('mongodb');
var morgan = require('morgan');

var app = express();
app.disable('etag');
app.use(morgan('common'));

app.use(function(req, res, next) {
  req.debug = req.app.get('debug');
  next();
});

app.use('/api/v2/', require('../src/api/routes'));
app.use('/api/', require('../src/routes'));

app.use('/assets/libs/', express.static(__dirname + '/../node_modules/'));
app.use('/', express.static(__dirname + '/../web/'));

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


app.set('debug', process.argv.some(function(arg) {
  return arg.toLowerCase() == '--debug';
}));

mongodb.MongoClient.connect('mongodb://localhost:27017/awesomelib', function(err, db) {
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
