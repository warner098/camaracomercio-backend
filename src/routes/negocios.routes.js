const express = require("express");
const router = express.Router();

const negociosController = require("../controllers/negocios.controller");
const verifyToken = require("../middlewares/auth");

// público
router.get("/", negociosController.listar);
router.get("/:id_negocio", negociosController.detalle);

// protegido
router.post(
  "/",
  verifyToken(["negocio", "admin"]),
  negociosController.crear
);

router.put(
  "/:id_negocio",
  verifyToken(["negocio", "admin"]),
  negociosController.editar
);

router.delete(
  "/:id_negocio",
  verifyToken(["negocio", "admin"]),
  negociosController.eliminar
);

module.exports = router;