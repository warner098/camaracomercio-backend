const express = require("express");
const router = express.Router();
const pagosController = require("../controllers/pagos.controller");
const verifyToken = require("../middlewares/auth");

<<<<<<< HEAD
router.post("/payphone", verifyToken(["cliente"]), pagosController.linkPayphone);
=======
router.post("/payphone", verifyToken(["cliente", "negocio", "admin"]), pagosController.linkPayphone);
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
router.post("/webhook", pagosController.webhookConfirmacion);

module.exports = router;