const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/auth");
const reportesController = require("../controllers/reportes.controller");

router.get("/listado", verifyToken(["negocio"]), reportesController.listarReportesGuardados);
router.get("/resumen", verifyToken(["negocio"]), reportesController.resumenMensualNegocio);
router.get("/admin/analitica", verifyToken(["admin"]), reportesController.analiticaAdmin);
router.get("/pdf", verifyToken(["negocio"]), reportesController.generarPDF);
router.post("/guardar", verifyToken(["negocio"]), reportesController.guardarReporte);
router.delete("/eliminar/:id", verifyToken(["negocio"]), reportesController.eliminarReporte);

module.exports = router;
