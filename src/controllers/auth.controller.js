const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registro = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ ok: false, message: "Datos incompletos" });
  }

  const hash = await bcrypt.hash(password, 10);

  db.query(
    `INSERT INTO usuarios (nombre, email, password, rol)
     VALUES (?, ?, ?, ?)`,
    [nombre, email, hash, rol],
    (err) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al registrar" });

      res.json({ ok: true, message: "Usuario registrado" });
    }
  );
};

const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ ok: false, message: "Datos incompletos" });

  db.query(
    "SELECT * FROM usuarios WHERE email = ? AND estado = 1",
    [email],
    async (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error de servidor" });

      if (rows.length === 0)
        return res.status(401).json({ ok: false, message: "Credenciales inválidas" });

      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password);

      if (!valid)
        return res.status(401).json({ ok: false, message: "Credenciales inválidas" });

      const token = jwt.sign(
        { id_usuario: user.id_usuario, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      res.json({
        ok: true,
        token,
        user: {
          id_usuario: user.id_usuario,
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