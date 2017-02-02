function _notAllowed(req, res) { res.send(new Response.MethodNotAllowed()); }

module.exports = function (api) {
  api.get ('/', _notAllowed);
  
  api.post('/', function (req, res) { res.send({ id: "0", lat: 44.452714, long: 26.085903, size: 250 }); });
};
