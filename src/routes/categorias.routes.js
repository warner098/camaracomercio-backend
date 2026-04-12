const express = require("express");
const router = express.Router();

const categoriasController = require("../controllers/categorias.controller");
const verifyToken = require("../middlewares/auth");

// público
router.get("/", categoriasController.listar);

// admin
router.post(
  "/",
  verifyToken(["admin"]),
  categoriasController.crear
);

router.put(
  "/:id_categoria",
  verifyToken(["admin"]),
  categoriasController.editar
);

<<<<<<< HEAD
=======
router.put("/:id_categoria/activar", verifyToken(["admin"]), categoriasController.activar);

>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
router.delete(
  "/:id_categoria",
  verifyToken(["admin"]),
  categoriasController.eliminar
);

module.exports = router;