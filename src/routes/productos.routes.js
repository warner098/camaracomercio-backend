const express = require("express");
const router = express.Router();

const productosController = require("../controllers/productos.controller");
const verifyToken = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// público
router.get("/", productosController.listarTodos);

router.get(
  "/negocio/:id_negocio",
  productosController.listarPorNegocio
);

// SOLO NEGOCIO Y ADMIN
router.get(
  "/mis-productos",
  verifyToken(["negocio", "admin"]),
  productosController.listarMisProductos
);

router.post(
  "/",
  verifyToken(["negocio", "admin"]),
  upload.single("foto"),
  productosController.crear
);

router.put(
  "/:id_producto",
  verifyToken(["negocio", "admin"]),
  upload.single("foto"), 
  productosController.editar
);

router.delete(
  "/:id_producto",
  verifyToken(["negocio", "admin"]),
  productosController.eliminar
);

router.put(
  "/:id_producto/activar",
  verifyToken(["negocio", "admin"]),
  productosController.activar
);

module.exports = router;