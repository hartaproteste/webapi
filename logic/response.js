var _ = require('underscore');

/**
  * Response object
  */

global.Response = function Response(body, code, headers) {
  if (undefined === code) {
    this.code = (_.isEmpty(body)) ? 204 : 200;  
  } else {
    this.code = code;  
  }
  
  if (Buffer.isBuffer(body)) {
    this.body = body;

    this.headers = _.extend({}, headers);
  } else if (_.isObject(body)) {
    this.body = JSON.stringify(body);

    this.headers = _.extend({ 'content-type' : 'application/json' }, headers);
  } else {
    this.body = '' + body;

    this.headers = _.extend({ 'content-type' : 'text/plain' }, headers);
  }

  this.source = body;
};

Response.prototype   = new Error('Response');
Response.constructor = Response;

Response.extend = function (body, code, headers) {
  var child = function (body, code, headers) {
    if (undefined !== code) {
      this.code = code;  
    }

    if (undefined !== body) {
      if (Buffer.isBuffer(body)) {
        this.body = body;
        
        this.headers = _.defaults(_.extend({}, headers), this.constructor.prototype.headers);
      } else if (_.isObject(body)) {
        this.body = JSON.stringify(body);

        this.headers = _.defaults(_.extend({ 'content-type' : 'application/json' }, headers), this.constructor.prototype.headers);
      } else {
        this.body = '' + body;
      
        this.headers = _.defaults(_.extend({ 'content-type' : 'text/plain' }, headers), this.constructor.prototype.headers);
      }
    
      this.source = body;
    } else {
      this.headers = _.defaults(_.extend({}, headers), this.constructor.prototype.headers);
    }
  };

  child.prototype = new Response(body, code, headers);
  child.constructor = child;

  return child;
};

/**
  * Response templates
  */

// Success responses
Response.OK       = Response.extend('OK',          200);
Response.Created  = Response.extend('Created',     201);
Response.Accepted = Response.extend('Accepted',    202);
Response.Empty    = Response.extend(new Buffer(0), 204);

// Redirects
Response.Redirect    = Response.extend(new Buffer(0), 302);
Response.NotModified = Response.extend(new Buffer(0), 304);

// Client errors
Response.BadRequest       = Response.extend('Bad request',          400);
Response.Unauthorized     = Response.extend('Not authorized',       401);
Response.Forbidden        = Response.extend('Forbidden',            403);
Response.NotFound         = Response.extend('Not found',            404);
Response.MethodNotAllowed = Response.extend('Method not allowed',   405);
Response.NotAcceptable    = Response.extend('Not acceptable',       406);
Response.ClientTimeout    = Response.extend('Timed out',            408);
Response.Conflict         = Response.extend('Conflict',             409);
Response.Gone             = Response.extend('Gone',                 410);
Response.TooLarge         = Response.extend('Too large to process', 413);
Response.TooManyRequests  = Response.extend('Too many requests',    429);
Response.LoginExpired     = Response.extend('Login has expired',    440);

// Server errors
Response.InternalError  = Response.extend('Internal error',  500);
Response.NotImplemented = Response.extend('Not implemented', 501);
Response.Unavailable    = Response.extend('Not available',   503);
Response.Timeout        = Response.extend('Timed out',       504);
Response.TryAgain       = Response.extend('Try again',       550);

/**
  * Exports
  */

module.exports = function middleware(req, res, next) {
  var _send = res.send;

  res.send = function (body) {
    if (body instanceof Response) {
      this.status(body.code);
      this.set(body.headers);
       
      if (!_.isEmpty(body.body)) {
        if (Buffer.isBuffer(body.body)) {
          if (!body.body.length) {
            return _send.call(this);  
          }
        }

        return _send.call(this, body.body);
      }
      
      return _send.call(this);  
    }

    return _send.apply(this, arguments);
  }

  next();
};
