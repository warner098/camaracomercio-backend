const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/registro", authController.registro);
router.post("/login", authController.login);
router.post("/verificar", authController.verificarCuenta);

// Nuevas rutas para recuperación de contraseña
router.post("/recuperar-password", authController.solicitarRecuperacion);
router.post("/restablecer-password", authController.restablecerPassword);

module.exports = router;