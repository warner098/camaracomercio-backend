const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");
const reportesController = require("../controllers/reportes.controller");

// ✅ Obtener listado de reportes archivados en la BD
router.get("/listado", verifyToken(["negocio", "admin"]), reportesController.listarReportesGuardados);

// ✅ Generar y descargar el PDF analítico del mes
router.get("/pdf", verifyToken(["negocio", "admin"]), reportesController.generarPDF);

// ✅ Guardar el balance de un mes en la BD
router.post("/guardar", verifyToken(["negocio", "admin"]), reportesController.guardarReporte);

// ✅ Eliminar un reporte archivado de la BD
router.delete("/eliminar/:id", verifyToken(["negocio", "admin"]), reportesController.eliminarReporte);

module.exports = router;