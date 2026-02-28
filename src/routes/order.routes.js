const express = require("express");
const router = express.Router();

const {
  crearOrden,
  ordenesCliente,
  ordenesNegocio,
  cambiarEstado,
  detalleOrden
} = require("../controllers/order.controller");

const verifyToken = require("../middlewares/auth");

// ==========================
// CLIENTE
// ==========================
router.post(
  "/",
  verifyToken(["cliente"]),
  crearOrden
);

router.get(
  "/cliente",
  verifyToken(["cliente"]),
  ordenesCliente
);

// ==========================
// NEGOCIO
// ==========================
router.get(
  "/negocio",
  verifyToken(["negocio", "admin"]), // ajusta luego cuando tengas rol negocio real
  ordenesNegocio
);

router.put(
  "/:id_orden/estado",
  verifyToken(["negocio", "admin"]),
  cambiarEstado
);

// ==========================
// DETALLE
// ==========================
router.get(
  "/:id_orden",
  verifyToken(["cliente", "negocio", "admin"]),
  detalleOrden
);

module.exports = router;