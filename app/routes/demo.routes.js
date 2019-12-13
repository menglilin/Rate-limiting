var express = require("express");
var router = express.Router();
var controller = require("../controllers/demo.controller.js");

router.get("/", controller.showPage);
router.get("/demo", controller.showPage);
router.get("/resetIp", controller.showResetPage);
router.get("/resetKey", controller.resetKey);

module.exports = router;
