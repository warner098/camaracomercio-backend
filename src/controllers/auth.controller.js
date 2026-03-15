const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const enviarVerificacion = require("../utils/mailer");
// =====================
// REGISTRO
// =====================
const registro = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Datos incompletos",
      });
    }

    const rol = "cliente";

    const [existe] = await db.query(
      "SELECT id FROM usuarios WHERE correo = ?",
      [email]
    );

    if (existe.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "El correo ya está registrado",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const tokenVerificacion = crypto.randomBytes(32).toString("hex");

    await db.query(
      `INSERT INTO usuarios (nombre, correo, contrasena, rol, token_verificacion)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, email, hash, rol, tokenVerificacion]
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
    return res.status(500).json({
      ok: false,
      message: "Error de servidor",
    });
  }
};

const verificarCuenta = async (req, res) => {

  const { token } = req.body;

  if (!token) {
  return res.status(400).json({
    ok:false,
    message:"Token requerido"
  });
}

  const [rows] = await db.query(
    "SELECT id FROM usuarios WHERE token_verificacion = ?",
    [token]
  );

  if (rows.length === 0) {
    return res.status(400).json({
      ok:false,
      message:"Token inválido"
    });
  }

  await db.query(
    `UPDATE usuarios
     SET verificado = TRUE,
     token_verificacion = NULL
     WHERE token_verificacion = ?`,
    [token]
  );

  res.json({
    ok:true,
    message:"Cuenta verificada"
  });

};

// =====================
// LOGIN
// =====================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: "Datos incompletos",
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE correo = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        message: "Credenciales inválidas",
      });
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
      return res.status(401).json({
        ok: false,
        message: "Credenciales inválidas",
      });
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
        rol: user.rol,
      },
    });

  } catch (error) {
    console.error("ERROR LOGIN:", error);
    return res.status(500).json({
      ok: false,
      message: "Error de servidor",
    });
  }
};


module.exports = {
  registro,
  login,
  verificarCuenta
};