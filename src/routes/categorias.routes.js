const express = require("express");
const router = express.Router();
const categoriasController = require("../controllers/categorias.controller");
const verifyToken = require("../middlewares/auth");

router.get("/", categoriasController.listar);

// admin
router.post("/", verifyToken(["admin"]), categoriasController.crear);
router.put("/:id_categoria", verifyToken(["admin"]), categoriasController.editar);
router.put("/:id_categoria/activar", verifyToken(["admin"]), categoriasController.activar);
router.delete("/:id_categoria", verifyToken(["admin"]), categoriasController.eliminar);

module.exports = router;