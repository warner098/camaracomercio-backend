const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

    // Verificar si ya existe
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

    await db.query(
      `INSERT INTO usuarios (nombre, correo, contrasena, rol)
       VALUES (?, ?, ?, ?)`,
      [nombre, email, hash, rol]
    );

    return res.status(201).json({
      ok: true,
      message: "Usuario registrado correctamente",
    });

  } catch (error) {
    console.error("ERROR REGISTRO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error de servidor",
    });
  }
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
};