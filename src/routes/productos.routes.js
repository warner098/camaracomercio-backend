const express = require("express");
const router = express.Router();

const productosController = require("../controllers/productos.controller");
const verifyToken = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// público
router.get("/", productosController.listarTodos);
router.post("/buscar-inteligente", productosController.buscarInteligente);

router.get(
  "/negocio/:id_negocio",
  productosController.listarPorNegocio
);

// SOLO NEGOCIO
router.get(
  "/mis-productos",
  verifyToken(["negocio"]),
  productosController.listarMisProductos
);

router.post(
  "/",
  verifyToken(["negocio"]),
  upload.single("foto"),
  productosController.crear
);

router.put(
  "/:id_producto",
  verifyToken(["negocio"]),
  upload.single("foto"), 
  productosController.editar
);

router.put(
  "/:id_producto/destacado",
  verifyToken(["negocio"]),
  productosController.toggleDestacado
);

router.delete(
  "/:id_producto",
  verifyToken(["negocio"]),
  productosController.eliminar
);

router.put(
  "/:id_producto/activar",
  verifyToken(["negocio"]),
  productosController.activar
);

module.exports = router;
