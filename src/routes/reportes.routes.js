const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");
const reportesController = require("../controllers/reportes.controller");

// ✅ Cambia las rutas para que tengan los roles explícitos
router.get("/pdf", verifyToken(["negocio", "admin"]), reportesController.descargarReportePDF);
router.get("/listado", verifyToken(["negocio", "admin"]), reportesController.listarReportes);

module.exports = router;