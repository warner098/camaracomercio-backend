const express = require("express");
const router = express.Router();
<<<<<<< HEAD

const negociosController = require("../controllers/negocios.controller");
const verifyToken = require("../middlewares/auth");

// público
router.get("/", negociosController.listar);

router.get(
  "/mi-negocio",
  verifyToken(["negocio", "admin"]),
  negociosController.miNegocio
);

router.get("/:id_negocio", negociosController.detalle);

// protegido
router.post(
  "/",
  verifyToken(["negocio", "admin"]),
  negociosController.crear
);

=======
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

// 🔥 Ruta para Editar TEXTO (Sin upload)
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
router.put(
  "/:id_negocio",
  verifyToken(["negocio", "admin"]),
  negociosController.editar
);

<<<<<<< HEAD
router.delete(
  "/:id_negocio",
  verifyToken(["negocio", "admin"]),
  negociosController.eliminar
);

router.put(
  "/:id_negocio/config-pago",
  verifyToken(["negocio", "admin"]),
  negociosController.actualizarConfigPago
);
=======
// 🔥 NUEVA Ruta para Editar IMÁGENES
router.put(
  "/:id_negocio/imagenes",
  verifyToken(["negocio", "admin"]),
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), 
  negociosController.actualizarImagenes
);

router.delete("/:id_negocio", verifyToken(["negocio", "admin"]), negociosController.eliminar);
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)

module.exports = router;