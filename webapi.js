process.on('uncaughtException', function (err) {
  console.error(new Date().toISOString(), 'FATAL', err);

  process.exit(-1);
});

global.Promise = require('bluebird');
global._       = require('underscore');

global.config = require('./config.json');

config['pg'].host = config['pg'].host || process.env.PGHOST;
config['pg'].port = config['pg'].port || process.env.PGPORT;

config['pg'].database = config['pg'].database || process.env.PGDATABASE;
config['pg'].user     = config['pg'].user     || process.env.PGUSER;
config['pg'].password = config['pg'].password || process.env.PGPASSWORD;

if (config.debug) {
  Promise.longStackTraces();
}

global.db = Promise.promisifyAll(new require('pg').Pool(config.pg));

var api = require('express')();

api.use(require('./logic/response'));
api.use(function (req, res, next) { req.now = new Date().getTime() / 1000; next(); });
api.use(require('body-parser').json());
api.use(function (err, req, res, next) { if (err instanceof SyntaxError) { return next(new Response.BadRequest(err.message)); } next(err); });

require('./logic/web')(api);

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

require('http').createServer(api).listen(config.listen.port, config.listen.ip, function (err) {
  if (err) {
    console.error(new Date().toISOString(), 'FATAL', 'Failed starting on ' + config.listen.ip + ':' + config.listen.port, err);

    process.exit(-2);
  } else {
    console.log(new Date().toISOString(), 'INFO', 'Started on ' + config.listen.ip + ':' + config.listen.port);
  }
});
