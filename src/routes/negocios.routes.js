const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const negociosController = require("../controllers/negocios.controller");
const verifyToken = require("../middlewares/auth");

router.get("/", negociosController.listar);
router.get("/mi-negocio", verifyToken(["negocio"]), negociosController.miNegocio);

router.post("/", verifyToken(["negocio"]), negociosController.crear);
router.get("/admin/todos", verifyToken(["admin"]), negociosController.listarAdmin);
router.put("/admin/:id_negocio/estado", verifyToken(["admin"]), negociosController.toggleEstadoAdmin);
router.put("/admin/:id_negocio/destacado", verifyToken(["admin"]), negociosController.toggleDestacadoAdmin);

router.get("/:id_negocio", negociosController.detalle);
router.put("/:id_negocio", verifyToken(["negocio"]), negociosController.editar);
router.put("/:id_negocio/config-pago", verifyToken(["negocio"]), negociosController.actualizarConfigPago);
router.put(
  "/:id_negocio/imagenes",
  verifyToken(["negocio"]),
  upload.fields([{ name: "logo", maxCount: 1 }, { name: "banner", maxCount: 1 }]),
  negociosController.actualizarImagenes
);
router.delete("/:id_negocio", verifyToken(["negocio"]), negociosController.eliminar);

module.exports = router;
