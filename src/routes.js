var router = require('express').Router();
var child_process = require('child_process');


router.get('/ping', function (req, res, next) {
    res.send('pong');
});

router.get('/update', function (req, res, next) {
    res.sendStatus(204);
    process.kill(process.pid);
});

module.exports = router;
