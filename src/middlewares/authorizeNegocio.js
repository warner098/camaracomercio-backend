const db = require("../config/db");

module.exports = (req, res, next) => {
  const id_usuario = req.user.id_usuario;
  const id_negocio = req.params.id_negocio || req.body.id_negocio;

  if (!id_negocio)
    return res.status(400).json({ ok: false, message: "Negocio no especificado" });

  if (req.user.rol === "admin") return next();

  db.query(
    `SELECT id_negocio 
     FROM usuarios_negocios 
     WHERE id_negocio = ? AND id_usuario = ?`,
    [id_negocio, id_usuario],
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error de servidor" });

      if (rows.length === 0)
        return res.status(403).json({ ok: false, message: "No autorizado" });

      next();
    }
  );
};