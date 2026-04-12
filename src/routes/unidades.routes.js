// src/routes/unidades.routes.js
const express = require("express");
const router = express.Router();
const unidadesController = require("../controllers/unidades.controller");
const verifyToken = require("../middlewares/auth");

router.get("/", unidadesController.listar); 
router.post("/", verifyToken(["admin"]), unidadesController.crear);
router.put("/:id_unidad", verifyToken(["admin"]), unidadesController.editar);
// 🔥 Nueva ruta para activar
router.put("/:id_unidad/activar", verifyToken(["admin"]), unidadesController.activar);
router.delete("/:id_unidad", verifyToken(["admin"]), unidadesController.eliminar);

module.exports = router;