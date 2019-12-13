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
const rateLimiting = rateLimit({
  appName: "test",
  expire: 2 * 60 * 1000, // 2 minutes
  max: 5
});

//set Rate-limiting on demo page
app.use("/demo", rateLimiting);

app.use("/", routes);

app.listen(3002, function() {
  console.log("Testing app listening on 127.0.0.1:3002!");
});

module.exports = app;
