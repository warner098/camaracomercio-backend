const express = require("express");
const router = express.Router();

const productosController = require("../controllers/productos.controller");
const verifyToken = require("../middlewares/auth");
const authorizeNegocio = require("../middlewares/authorizeNegocio");
const upload = require("../middlewares/upload");

// público
router.get(
  "/negocio/:id_negocio",
  productosController.listarPorNegocio
);

router.get(
  "/mis-productos",
  verifyToken(["negocio", "admin"]),
  productosController.listarMisProductos
);

// protegido
router.post(
  "/",
  verifyToken(["negocio", "admin"]),
  authorizeNegocio,
  upload.single("foto"),
  productosController.crear
);

router.put(
  "/:id_producto",
  verifyToken(["negocio", "admin"]),
  productosController.editar
);

router.delete(
  "/:id_producto",
  verifyToken(["negocio", "admin"]),
  productosController.eliminar
);

module.exports = router;