const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =====================
// REGISTRO
// =====================
const registro = async (req, res) => {
  const { nombre, email, password } = req.body;

if (!nombre || !email || !password) {
  return res.status(400).json({ ok: false, message: "Datos incompletos" });
}

const rol = "cliente";

  try {
    const hash = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO usuarios (nombre, correo, contrasena, rol)
       VALUES (?, ?, ?, ?)`,
      [nombre, email, hash, rol],
      (err) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            message: "Error al registrar usuario"
          });
        }

        res.json({
          ok: true,
          message: "Usuario registrado correctamente"
        });
      }
    );
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error de servidor" });
  }
};

// =====================
// LOGIN
// =====================
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: "Datos incompletos" });
  }

  db.query(
    "SELECT * FROM usuarios WHERE correo = ?",
    [email],
    async (err, rows) => {
      if (err) {
        return res.status(500).json({ ok: false, message: "Error de servidor" });
      }

      if (rows.length === 0) {
        return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
      }

      const user = rows[0];
      const valid = await bcrypt.compare(password, user.contrasena);

      if (!valid) {
        return res.status(401).json({ ok: false, message: "Credenciales inválidas" });
      }

      const token = jwt.sign(
        { id_usuario: user.id, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      res.json({
        ok: true,
        token,
        user: {
          id_usuario: user.id,
          nombre: user.nombre,
          rol: user.rol
        }
      });
    }
  );
};

module.exports = {
  registro,
  login
};