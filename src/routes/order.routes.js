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
  verifyToken(["cliente", "admin"]), // ajusta luego cuando tengas rol negocio real
  ordenesNegocio
);

router.put(
  "/:id_orden/estado",
  verifyToken(["cliente", "admin"]),
  cambiarEstado
);

// ==========================
// DETALLE
// ==========================
router.get(
  "/:id_orden",
  verifyToken(["cliente", "admin"]),
  detalleOrden
);

module.exports = router;