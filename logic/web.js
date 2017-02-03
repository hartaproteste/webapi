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
      req.body = _.pick(req.body, (v) => (!_.isEmpty(v) || _.isFinite(v)));

      valid(req.body, {
        uid  : 'required',
        ts   : 'required|numeric',
        lat  : 'required|numeric|minVal:-90|maxVal:90',
        lon  : 'required|numeric|minVal:-180|maxVal:180',
        prec : 'numeric'
      });

      return db.query(['INSERT INTO "protests.members"("received", "uid", "ts", "position", "precision", "note")',
          'VALUES (',
            'to_timestamp($1) AT TIME ZONE \'UTC\',',
            '$2,',
            'to_timestamp($3) AT TIME ZONE \'UTC\',',
            '$4,',
            'topology.ST_GeomFromText(\'POINT($5, $6)\'),',
            '$7',
          ') RETURNING *'].join(' '), [
            req.now,
            req.body['uid'],
            req.body['ts'],
            req.body['lat'], req.body['lon'],
            req.body['prec'],
            req.body['msg']
          ]
        );
    }).then(function (result) {
      console.log(result);
    }).then(function () {
      var dummy = { id: '0', lat: 44.452714, lon: 26.085903, size: 250 };

      switch (req.get('X-Debug')) {
        case 'same':
          dummy.lat = req.body.lat;
          dummy.lon = req.body.lon;

          break;
      }

      res.send(new Response.OK(dummy));
    }).catch(valid.Error, function (e) {
      throw new Response.BadRequest(_.values(_.values(e.errors)[0])[0][0]);
    }).catch(function (err) {
      next(err);
    }).done();
  });
};
