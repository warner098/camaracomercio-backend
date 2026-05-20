const express = require("express");
const router = express.Router();

const controller = require("../controllers/solicitudes.controller");
const verifyToken = require("../middlewares/auth");


router.get(
  "/mi-estado",
  verifyToken(["cliente", "negocio", "admin"]),
  controller.verificarMiEstado
);

// Cliente envía solicitud
router.post(
  "/",
  verifyToken(["cliente"]),
  controller.crearSolicitud
);

router.get("/categorias", controller.obtenerCategorias);

// Admin lista
router.get(
  "/",
  verifyToken(["admin"]),
  controller.listarSolicitudes
);

// Admin aprueba/rechaza
router.put(
  "/:id_solicitud",
  verifyToken(["admin"]),
  controller.cambiarEstado
);

module.exports = router;