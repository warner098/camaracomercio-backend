const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { enviarVerificacion, enviarRecuperacion } = require("../utils/mailer");
const validarCedulaEcuatoriana = require("../utils/validarCedula");

// =====================
// REGISTRO
// =====================
const registro = async (req, res) => {
  try {
    const { nombre, cedula, email, password } = req.body;

    if (!nombre || !cedula || !email || !password) {
      return res.status(400).json({ ok: false, message: "Datos incompletos" });
    }

    if (!validarCedulaEcuatoriana(cedula)) {
      return res.status(400).json({ ok: false, message: "La cédula ingresada no es válida" });
    }

    const rol = "cliente";

    const [existe] = await db.query(
      "SELECT id FROM usuarios WHERE correo = ? OR cedula = ?",
      [email, cedula]
    );

    if (existe.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "El correo o la cédula ya están registrados",
      });
    }

    const hash = await bcrypt.hash(password, 10);
    const tokenVerificacion = crypto.randomBytes(32).toString("hex");

    await db.query(
      `INSERT INTO usuarios (nombre, cedula, correo, contrasena, rol, token_verificacion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, cedula, email, hash, rol, tokenVerificacion]
    );

    const link = `${process.env.FRONTEND_URL}/verificar?token=${tokenVerificacion}`;

    enviarVerificacion(email, link)
      .then(() => console.log("Correo enviado"))
      .catch(err => console.error("Error enviando correo:", err));

    return res.status(201).json({
      ok: true,
      message: "Registro exitoso. Revisa tu correo para activar tu cuenta.",
    });

  } catch (error) {
    console.error("ERROR REGISTRO:", error);
    return res.status(500).json({ ok: false, message: "Error de servidor" });
  }
};

// =====================
// VERIFICAR CUENTA
// =====================
const verificarCuenta = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ ok: false, message: "Token requerido" });
  }

  const [rows] = await db.query(
    "SELECT id FROM usuarios WHERE token_verificacion = ?",
    [token]
  );

  if (rows.length === 0) {
    return res.status(400).json({ ok: false, message: "Token inválido" });
  }

  await db.query(
    `UPDATE usuarios SET verificado = TRUE, token_verificacion = NULL WHERE token_verificacion = ?`,
    [token]
  );

  res.json({ ok: true, message: "Cuenta verificada" });
};

// =====================
// LOGIN
// =====================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: "Datos incompletos" });
    }

    const [rows] = await db.query("SELECT * FROM usuarios WHERE correo = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    const user = rows[0];

    if (!user.verificado) {
      return res.status(401).json({
        ok: false,
        message: "Debes verificar tu correo antes de iniciar sesión"
      });
    }

    const valid = await bcrypt.compare(password, user.contrasena);

    if (!valid) {
      return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id_usuario: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id_usuario: user.id,
        nombre: user.nombre,
        cedula: user.cedula,
        rol: user.rol,
      },
    });

  } catch (error) {
    console.error("ERROR LOGIN:", error);
    return res.status(500).json({ ok: false, message: "Error de servidor" });
  }
};

// =====================
// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// =====================
const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, message: "El correo es requerido" });
    }

    const [rows] = await db.query("SELECT id FROM usuarios WHERE correo = ?", [email]);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: "No existe una cuenta con ese correo" });
    }

    const user = rows[0];
    const tokenRecuperacion = crypto.randomBytes(32).toString("hex");
    
    // Expiración en 1 hora
    const expiracion = new Date(Date.now() + 3600000);

    await db.query(
      "UPDATE usuarios SET token_recuperacion = ?, expiracion_token = ? WHERE id = ?",
      [tokenRecuperacion, expiracion, user.id]
    );

    const link = `${process.env.FRONTEND_URL}/restablecer-password?token=${tokenRecuperacion}`;

    await enviarRecuperacion(email, link)
      .then(() => console.log("Correo de recuperación enviado"))
      .catch(err => console.error("Error enviando correo:", err));

    return res.json({
      ok: true,
      message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
    });

  } catch (error) {
    console.error("ERROR RECUPERACIÓN:", error);
    return res.status(500).json({ ok: false, message: "Error de servidor" });
  }
};

// =====================
// RESTABLECER CONTRASEÑA
// =====================
const restablecerPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // 1. Log para ver qué llega al backend
    console.log("Intentando restablecer con token:", token);

    if (!token || !newPassword) {
      return res.status(400).json({ ok: false, message: "Datos incompletos" });
    }

    // 2. Buscamos el usuario ignorando la fecha por un segundo para debuggear
    const [userRows] = await db.query(
      "SELECT id, expiracion_token FROM usuarios WHERE token_recuperacion = ?",
      [token]
    );

    if (userRows.length === 0) {
      return res.status(400).json({ ok: false, message: "El token no existe en la base de datos." });
    }

    const usuario = userRows[0];
    const ahora = new Date();

    // 3. Validamos la fecha manualmente en JS para evitar líos de zona horaria de SQL
    if (new Date(usuario.expiracion_token) < ahora) {
        return res.status(400).json({ ok: false, message: "El enlace ha expirado. Solicita uno nuevo." });
    }

    // 4. Si todo está bien, actualizamos
    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE usuarios 
       SET contrasena = ?, token_recuperacion = NULL, expiracion_token = NULL 
       WHERE id = ?`,
      [hash, usuario.id]
    );

    return res.json({ ok: true, message: "Contraseña actualizada correctamente" });

  } catch (error) {
    console.error("ERROR RESTABLECER PASSWORD:", error);
    return res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
};

module.exports = {
  registro,
  login,
  verificarCuenta,
  solicitarRecuperacion,
  restablecerPassword
};