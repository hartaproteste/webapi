var valid = require('./valid');

function _notAllowed(req, res) { res.send(new Response.MethodNotAllowed()); }

function _noCache(req, res, next) {
  res.set({
    'Cache-Control' : 'no-cache, no-store, must-revalidate',
    'Pragma'        : 'no-cache',
    'Expires'       : 0
  });

  next();
}

module.exports = function (api) {
  api.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', req.headers['origin'] || '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, If-Modified-Since, X-Debug');
    res.header('Access-Control-Expose-Headers', 'Cache-Control, Content-Disposition, Content-Type, Expires, Last-Modified, Location, Pragma, Vary');
    res.header('Access-Control-Allow-Methods', 'HEAD, GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', 60 * 60);

    if ('OPTIONS' == req.method) {
      res.status(200).end();
      return;
    }

    next();
  });

  api.get ('/', _notAllowed);
  
  api.post('/', _noCache, function (req, res, next) {
    Promise.try(function () {
      req.body = _.pick(req.body, (v) => (!_.isEmpty(v) && !_.isFinite(v)));

      valid(req.body, {
        uid       : 'required',
        ts        : 'required|numeric',
        lat       : 'required|numeric|minVal:-90|maxVal:90',
        long      : 'required|numeric|minVal:-180|maxVal:180',
        prec      : 'numeric'
      });
    }).then(function () {
      res.send(new Response.OK({ id: '0', lat: 44.452714, long: 26.085903, size: 250 }));
    }).catch(valid.Error, function (e) {
      throw new Response.BadRequest(_.values(_.values(e.errors)[0])[0][0]);
    }).catch(function (err) {
      next(err);
    }).done();
  });
};
