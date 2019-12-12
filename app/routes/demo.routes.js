var express = require("express");
var router = express.Router();
var controller = require("../controllers/demo.controller.js");

router.get("/", controller.showLogin);
//router.get("/", controller.showPage);

module.exports = router;
