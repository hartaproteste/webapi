function _notAllowed(req, res) { res.send(new Response.MethodNotAllowed()); }

module.exports = function (api) {
  api.get('/', _notAllowed);
  
  api.post('/test', function (req, res) { res.send(req.body); });
};
