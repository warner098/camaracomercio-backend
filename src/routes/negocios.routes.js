const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const negociosController = require("../controllers/negocios.controller");
const verifyToken = require("../middlewares/auth");

// Público
router.get("/", negociosController.listar);
router.get("/mi-negocio", verifyToken(["negocio", "admin"]), negociosController.miNegocio);
router.get("/:id_negocio", negociosController.detalle);

// Protegido
router.post("/", verifyToken(["negocio", "admin"]), negociosController.crear);
router.get("/admin/todos", verifyToken(["admin"]), negociosController.listarAdmin);
router.put("/admin/:id_negocio/estado", verifyToken(["admin"]), negociosController.toggleEstadoAdmin);

// Editar TEXTO
router.put("/:id_negocio", verifyToken(["negocio", "admin"]), negociosController.editar);

// Editar IMÁGENES
router.put(
  "/:id_negocio/imagenes",
  verifyToken(["negocio", "admin"]),
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), 
  negociosController.actualizarImagenes
);

router.delete("/:id_negocio", verifyToken(["negocio", "admin"]), negociosController.eliminar);

module.exports = router;