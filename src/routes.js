var router = require('express').Router();
var child_process = require('child_process');


router.get('/ping', function (req, res, next) {
    res.send('pong');
});

router.get('/update',function(req, res, next){
    var child = child_process.spawn('npm', ['install']);
    var stdout = [], stderr = [];
    child.stdout.on('data', function (buffer) {
        stdout.push(buffer);
    });
    child.stderr.on('data', function (buffer) {
        stderr.push(buffer);
    });

    function sanitize(buffers) {
        return Buffer.concat(buffers).toString().split('\n').filter(function (l) {
            return !!l;
        });
    }

    child.on('close', function () {
        res.send({
            stdout: sanitize(stdout),
            stderr: sanitize(stderr)
        });

        process.kill(process.pid);
    });
});

module.exports = router;
