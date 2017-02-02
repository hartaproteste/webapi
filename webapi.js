process.on('uncaughtException', function (err) {
  console.error(new Date().toISOString(), 'FATAL', err);

  process.exit(-1);
});

global.Promise = require('bluebird');
global._       = require('underscore');

global.config = require('./config.json');

console.log(process.env.PGHOST);
