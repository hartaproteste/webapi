function _notAllowed(req, res) { res.send(new Response.MethodNotAllowed()); }

module.exports = function (app) {
  app.get('/', _notAllowed);
  
  app.post('/test', function (req, res) { res.send(req.body); });
};
