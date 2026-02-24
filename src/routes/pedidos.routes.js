const express = require("express");
const router = express.Router();

const pedidosController = require("../controllers/pedidos.controller");
const verifyToken = require("../middlewares/auth");

// ==========================
// CLIENTE
// ==========================
router.post(
  "/",
  verifyToken(["cliente"]),
  pedidosController.crearPedido
);

router.get(
  "/cliente",
  verifyToken(["cliente"]),
  pedidosController.pedidosCliente
);

// ==========================
// NEGOCIO
// ==========================
router.get(
  "/negocio",
  verifyToken(["negocio"]),
  pedidosController.pedidosNegocio
);

router.put(
  "/:id_pedido/estado",
  verifyToken(["negocio", "admin"]),
  pedidosController.cambiarEstado
);

// ==========================
// DETALLE
// ==========================
router.get(
  "/:id_pedido",
  verifyToken(["cliente", "negocio", "admin"]),
  pedidosController.detallePedido
);

module.exports = router;