const db = require("../config/db");

const authorizePedidoNegocio = (req, res, next) => {
  const { id_pedido } = req.params;
  const id_usuario = req.user.id_usuario;

  // Admin pasa directo
  if (req.user.rol === "admin") return next();

  db.query(
    `SELECT p.id_pedido
     FROM pedidos p
     JOIN usuarios_negocios un ON un.id_negocio = p.id_negocio
     WHERE p.id_pedido = ? AND un.id_usuario = ?`,
    [id_pedido, id_usuario],
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error de autorización" });

      if (rows.length === 0)
        return res.status(403).json({
          ok: false,
          message: "No puedes gestionar este pedido"
        });

      next();
    }
  );
};

module.exports = authorizePedidoNegocio;