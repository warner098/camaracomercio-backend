const express = require("express");
const router = express.Router();
const {
  crearOrden,
  ordenesCliente,
  ordenesNegocio,
  cambiarEstado,
  detalleOrden,
  obtenerHistorialMes
} = require("../controllers/order.controller");
const verifyToken = require("../middlewares/auth");

// ============================
// RUTAS FIJAS (SIEMPRE PRIMERO)
// ============================

// CLIENTE
router.post("/", verifyToken(["cliente", "negocio", "admin"]), crearOrden);
router.get("/mis-compras", verifyToken(["cliente", "negocio", "admin"]), ordenesCliente);

// NEGOCIO
router.get("/negocio", verifyToken(["negocio", "admin"]), ordenesNegocio);
// 🔥 Movida arriba de :id_orden para evitar el 404
router.get("/historial", verifyToken(["negocio", "admin"]), obtenerHistorialMes);


// ============================
// RUTAS DINÁMICAS (AL FINAL)
// ============================

router.get("/:id_orden", verifyToken(["cliente", "negocio", "admin"]), detalleOrden);
router.put("/:id_orden/estado", verifyToken(["negocio", "admin"]), cambiarEstado);

module.exports = router;