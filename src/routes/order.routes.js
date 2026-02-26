const express = require("express");
const router = express.Router();

const {
  crearPedido,
  pedidosPorNegocio
} = require("../controllers/order.controller");

const verifyToken = require("../middleware/auth");

// cliente crea pedido
router.post(
  "/",
  verifyToken(["cliente"]),
  crearPedido
);

// negocio ve SUS pedidos
router.get(
  "/negocio",
  verifyToken(["negocio"]),
  pedidosPorNegocio
);

module.exports = router;