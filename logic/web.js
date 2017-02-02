var valid = require('./valid');

function _notAllowed(req, res) { res.send(new Response.MethodNotAllowed()); }

module.exports = function (api) {
  api.get ('/', _notAllowed);
  
  api.post('/', function (req, res, next) {
    
    Promise.try(function () {
      req.body = _.pick(req.body, _.negate(_.isEmpty));

      utils.valid(req.body, {
        uid       : 'required',
        ts        : 'required|numeric',
        lat       : 'required|numeric|minVal:-90|maxVal:90',
        long      : 'required|numeric|minVal:-180|maxVal:180',
        prec      : 'numeric'
      });
    }).then(function () {
      res.send(new Response.OK({ id: '0', lat: 44.452714, long: 26.085903, size: 250 }));
    }).catch(valid.Error, function (e) {
      console.log(e);

      throw new Response.BadRequest(_.values(_.values(e.errors)[0])[0][0]);
    }).catch(function (err) {
      next(err);
    }).done();
  });
};
