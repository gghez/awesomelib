var method = process.argv[2];
var args = process.argv.slice(3);

var api = require('./' + method);
api.apply(undefined, args).then(function(data) {
  console.log(data);
}).catch(function(err) {
  if (err instanceof Error) {
    err = err.stack;
  }

  console.error(err);
});
