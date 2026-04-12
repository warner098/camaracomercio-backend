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
<<<<<<< HEAD
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
=======
router.post("/", verifyToken(["cliente", "negocio", "admin"]), crearOrden);
router.get("/mis-compras", verifyToken(["cliente", "negocio", "admin"]), ordenesCliente);
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)

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