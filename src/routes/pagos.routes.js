// ARCHIVO: routes/pagos.routes.js

const express = require("express");
const router = express.Router();
const pagosController = require("../controllers/pagos.controller");
const verifyToken = require("../middlewares/auth");

// Generar links (Protegidas)
router.post("/payphone", verifyToken(["cliente"]), pagosController.linkPayphone);
router.post("/kushki", verifyToken(["cliente"]), pagosController.linkKushki);

// Webhooks (Públicas, las llaman las pasarelas)
router.post("/webhook", pagosController.webhookConfirmacion);

module.exports = router;