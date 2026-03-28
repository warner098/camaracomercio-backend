const express = require("express");
const router = express.Router();
const pagosController = require("../controllers/pagos.controller");
const verifyToken = require("../middlewares/auth");

router.post("/payphone", verifyToken(["cliente"]), pagosController.linkPayphone);
router.post("/webhook", pagosController.webhookConfirmacion);

module.exports = router;