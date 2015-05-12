var router = require('express').Router();
var child_process = require('child_process');


router.get('/ping', function (req, res, next) {
    res.send('pong');
});

function spawnMiddleware(cmd, args, options) {
    return function (req, res, next) {
        var child = child_process.spawn(cmd, args, options);
        var stdout = [], stderr = [];
        child.stdout && child.stdout.on('data', function (buffer) {
            stdout.push(buffer);
        });
        child.stderr && child.stderr.on('data', function (buffer) {
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
        });

        child.unref();
    };
}

router.get('/update', spawnMiddleware('npm', ['install']));

router.get('/restart', spawnMiddleware('npm', ['restart'], { detached: true, stdio: 'ignore'}));

module.exports = router;
