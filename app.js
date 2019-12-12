var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var routes = require("./app/routes/demo.routes.js");
var rateLimit = require("./app/lib/rateLimiting.js");

var app = express();

app.set("views", path.join(__dirname, "app", "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

//Rate-limit
const rateLimiting = new rateLimit({
  appName: "test",
  expire: 2 * 60 * 1000, // 2 minutes
  max: 5
});
app.use(rateLimiting);

app.use("/", routes);

app.listen(3001, function() {
  console.log("Revision graphing app listening on port 3001!");
});

module.exports = app;
