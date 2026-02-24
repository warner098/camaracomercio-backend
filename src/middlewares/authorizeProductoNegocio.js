const db = require("../config/db");

const authorizeProductoNegocio = (req, res, next) => {
  const id_usuario = req.user.id_usuario;
  const { id_producto } = req.params;

  // Admin pasa
  if (req.user.rol === "admin") return next();

  db.query(
    `SELECT p.id_producto
     FROM productos p
     JOIN usuarios_negocios un ON un.id_negocio = p.id_negocio
     WHERE p.id_producto = ? AND un.id_usuario = ?`,
    [id_producto, id_usuario],
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error de autorización" });

      if (rows.length === 0)
        return res.status(403).json({
          ok: false,
          message: "No puedes modificar este producto"
        });

      next();
    }
  );
};

module.exports = authorizeProductoNegocio;