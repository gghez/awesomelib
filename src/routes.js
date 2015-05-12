var router = require('express').Router();
var fs = require('fs');
var Q = require('q');

router.get('/ping', function (req, res, next) {
    res.send('pong');
});

router.get('/update', function (req, res, next) {
    res.sendStatus(204);
    process.kill(process.pid);
});

router.get('/version', function (req, res, next) {
    Q.nfbind(fs.readFile)(__dirname + '/../package.json').then(function (data) {
        var json = JSON.parse(data);
        res.send({version: json.version});
    }).catch(next);
});

module.exports = router;
