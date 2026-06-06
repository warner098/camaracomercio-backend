const express = require("express");
const router = express.Router();
const {
  crearOrden,
  ordenesCliente,
  ordenesNegocio,
  cambiarEstado,
  detalleOrden,
  detalleOrdenNegocio,
  obtenerHistorialMes
} = require("../controllers/order.controller");
const verifyToken = require("../middlewares/auth");

router.post("/", verifyToken(["cliente", "negocio", "admin"]), crearOrden);
router.get("/mis-compras", verifyToken(["cliente", "negocio", "admin"]), ordenesCliente);

router.get("/negocio", verifyToken(["negocio"]), ordenesNegocio);
router.get("/historial", verifyToken(["negocio"]), obtenerHistorialMes);
router.get("/negocio/orden/:id_orden", verifyToken(["negocio"]), detalleOrdenNegocio);

router.get("/:id_orden", verifyToken(["cliente", "negocio", "admin"]), detalleOrden);
router.put("/:id_orden/estado", verifyToken(["negocio"]), cambiarEstado);

module.exports = router;
