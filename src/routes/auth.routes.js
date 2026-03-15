const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/registro", authController.registro);
router.post("/login", authController.login);

router.get("/verificar/:token", authController.verificarCuenta);

module.exports = router;