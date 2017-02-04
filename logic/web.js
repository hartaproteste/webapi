var crypto = require('crypto')
  , valid  = require('./valid');

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
    let hash = crypto.createHash(config['hash'].algorithm);
      
    hash.update(req.get('X-Real-IP') + config['hash'].salt + req.get('User-Agent'));

    let key = hash.digest('base64');

    Promise.try(function () {
      req.body = _.pick(req.body, (v) => (!_.isEmpty(v) || _.isFinite(v)));

      valid(req.body, {
        ts   : 'required|numeric',
        lat  : 'required|numeric|minVal:-90|maxVal:90',
        lon  : 'required|numeric|minVal:-180|maxVal:180',
        prec : 'numeric'
      });

      return db.query([
          'INSERT INTO "protest"."members"("received", "uid", "ts", "position", "precision", "note") VALUES (',
              'to_timestamp($1) AT TIME ZONE \'UTC\',',
              '$2,',
              'to_timestamp($3) AT TIME ZONE \'UTC\',',
              'topology.ST_GeomFromText(\'POINT(\' || $4 || \' \' || $5 || \')\', 4326),',
              '$6,',
              '$7',
            ')'
          ].join(' '), [
            req.now,
            key,
            req.body['ts'],
            req.body['lon'].toString(), req.body['lat'].toString(),
            parseInt(req.body['prec']) || null,
            req.body['msg'] || null
          ]
        );
    }).catch(function (err) {
      switch (err.routine) {
        case '_bt_check_unique':
          return;

        case 'ExecConstraints':
          switch (err.constraint) {
            case 'members_ts_valid':
              throw new Response.BadRequest('Protester from the future');
          }
      }

      throw err;
    }).then(function () {
      return db.query([
            'SELECT f.type, f.name, f.extra, (',
                'SELECT COUNT(DISTINCT t."uid") FROM "protest"."members" t WHERE t."fixed" = m."fixed"',
                'AND date_trunc(\'minute\'::text, t."ts") >= date_trunc(\'minute\'::text, to_timestamp($1) AT TIME ZONE \'UTC\')',
                'AND date_trunc(\'minute\'::text, t."ts") <= date_trunc(\'minute\'::text, to_timestamp($2) AT TIME ZONE \'UTC\')',
              ') AS "total"',
            'FROM "protest"."members" m, "position"."fixed" f WHERE m.fixed = f.id AND m."uid" = $3',
            'AND date_trunc(\'minute\'::text, m."ts") = date_trunc(\'minute\'::text, to_timestamp($2) AT TIME ZONE \'UTC\')'
          ].join(' '), [
            req.body['ts'] - config['trail'],
            req.body['ts'],
            key
          ]
        );
    }).then(function (result) {
      if (!result.rowCount) {
        return res.send(new Response.OK({}));
      }
      
      result = result.rows[0];

      res.send(new Response.OK({
        type  : result.type,
        name  : result.name,
        count : result.total
      }));
    }).catch(valid.Error, function (e) {
      throw new Response.BadRequest(_.values(_.values(e.errors)[0])[0][0]);
    }).catch(function (err) {
      next(err);
    }).done();
  });
};
