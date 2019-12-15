var rateLimit = require("../lib/rateLimiting.js");

module.exports.showPage = function(req, res) {
  res.render("demo.pug");
};
module.exports.showResetPage = function(req, res) {
  res.render("reset.pug");
};

// reset the rate limiting of IP
module.exports.resetKey = function(req, res) {
  var key = req.query.ip;
  const rateLimiting = new rateLimit({
    appName: "test"
  });
  rateLimiting.resetKey(key, function(err, result) {
    if (!err) {
      res.json(result);
    } else {
      console.log(err);
    }
  });
};
