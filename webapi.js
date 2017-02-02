process.on('uncaughtException', function (err) {
  console.error(new Date().toISOString(), 'FATAL', err);

  process.exit(-1);
});

global.Promise = require('bluebird');
global._       = require('underscore');

global.config = require('./config.json');

if (config.debug) {
  Promise.longStackTraces();
}

console.log(process.env.PGHOST);

var api = require('express')();

api.use(function (req, res, next) { req.now = new Date().getTime() / 1000; next(); });
api.use(require('body-parser').json());
api.use(require('./logic/response'));
api.use(require('./logic/web'));
api.use(function (req, res) { res.send(new Response.NotFound()); });

// Error handling
api.use(function (err, req, res, next) {
  var response = null;

  if (err instanceof Response) {
    response = err;
  } else if (err instanceof Error) {
    console.error(new Date().toISOString(), 'ERROR', err);
  
    response = new Response.InternalError();
  }
  
  res.send(response);
});

require('http').createServer(api).listen(config.listen.public.port, config.listen.public.ip, function (err) {
  if (err) {
    console.error(new Date().toISOString(), 'FATAL', 'Failed starting on ' + config.listen.public.ip + ':' + config.listen.public.port, err);

    process.exit(-2);
  } else {
    console.log(new Date().toISOString(), 'INFO', 'Started on ' + config.listen.public.ip + ':' + config.listen.public.port);
  }
});
