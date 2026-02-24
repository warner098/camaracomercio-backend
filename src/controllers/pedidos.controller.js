const db = require("../config/db");

// ============================
// CREAR PEDIDO (CLIENTE)
// ============================
exports.crearPedido = async (req, res) => {
  const id_cliente = req.user.id_usuario;
  const { id_negocio, cart } = req.body;

  if (!id_negocio || !cart || cart.length === 0)
    return res.status(400).json({ ok: false, message: "Pedido inválido" });

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let total = 0;

    // 1️⃣ validar productos
    for (const item of cart) {
      const [rows] = await connection.query(
        `SELECT precio, stock 
         FROM productos 
         WHERE id_producto = ? AND id_negocio = ? AND estado = 1`,
        [item.id_producto, id_negocio]
      );

      if (rows.length === 0)
        throw new Error("Producto no encontrado");

      if (rows[0].stock < item.cantidad)
        throw new Error("Stock insuficiente");

      total += rows[0].precio * item.cantidad;
    }

    // 2️⃣ crear pedido
    const [pedido] = await connection.query(
      `INSERT INTO pedidos (id_cliente, id_negocio, total)
       VALUES (?, ?, ?)`,
      [id_cliente, id_negocio, total]
    );

    const id_pedido = pedido.insertId;

    // 3️⃣ detalle + descuento stock
    for (const item of cart) {
      const [[producto]] = await connection.query(
        "SELECT precio FROM productos WHERE id_producto = ?",
        [item.id_producto]
      );

      await connection.query(
        `INSERT INTO detalle_pedido 
         (id_pedido, id_producto, cantidad, precio_unitario)
         VALUES (?, ?, ?, ?)`,
        [id_pedido, item.id_producto, item.cantidad, producto.precio]
      );

      await connection.query(
        "UPDATE productos SET stock = stock - ? WHERE id_producto = ?",
        [item.cantidad, item.id_producto]
      );
    }

    await connection.commit();

    res.json({
      ok: true,
      message: "Pedido creado correctamente",
      id_pedido
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ ok: false, message: error.message });
  } finally {
    connection.release();
  }
};

// ============================
// PEDIDOS DEL CLIENTE
// ============================
exports.pedidosCliente = (req, res) => {
  const id_cliente = req.user.id_usuario;

  db.query(
    `SELECT id_pedido, total, estado, created_at
     FROM pedidos
     WHERE id_cliente = ?
     ORDER BY created_at DESC`,
    [id_cliente],
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al listar pedidos" });

      res.json({ ok: true, data: rows });
    }
  );
};

// ============================
// PEDIDOS DEL NEGOCIO
// ============================
exports.pedidosNegocio = (req, res) => {
  const id_negocio = req.user.id_negocio;

  db.query(
    `SELECT id_pedido, total, estado, created_at
     FROM pedidos
     WHERE id_negocio = ?
     ORDER BY created_at DESC`,
    [id_negocio],
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al listar pedidos" });

      res.json({ ok: true, data: rows });
    }
  );
};

// ============================
// CAMBIAR ESTADO
// ============================
exports.cambiarEstado = (req, res) => {
  const { id_pedido } = req.params;
  const { estado } = req.body;

  const estadosValidos = [
    "pendiente",
    "confirmado",
    "en_preparacion",
    "entregado",
    "cancelado"
  ];

  if (!estadosValidos.includes(estado))
    return res.status(400).json({ ok: false, message: "Estado inválido" });

  db.query(
    "UPDATE pedidos SET estado = ? WHERE id_pedido = ?",
    [estado, id_pedido],
    (err, result) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al actualizar estado" });

      if (result.affectedRows === 0)
        return res.status(404).json({ ok: false, message: "Pedido no encontrado" });

      res.json({ ok: true, message: "Estado actualizado" });
    }
  );
};

// ============================
// DETALLE DEL PEDIDO
// ============================
exports.detallePedido = (req, res) => {
  const { id_pedido } = req.params;

  db.query(
    `SELECT p.id_pedido, p.total, p.estado, p.created_at,
            u.nombre AS cliente,
            n.nombre AS negocio
     FROM pedidos p
     JOIN usuarios u ON u.id_usuario = p.id_cliente
     JOIN negocios n ON n.id_negocio = p.id_negocio
     WHERE p.id_pedido = ?`,
    [id_pedido],
    (err, pedidoRows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al obtener pedido" });

      if (pedidoRows.length === 0)
        return res.status(404).json({ ok: false, message: "Pedido no encontrado" });

      db.query(
        `SELECT pr.nombre, d.cantidad, d.precio_unitario,
                (d.cantidad * d.precio_unitario) AS subtotal
         FROM detalle_pedido d
         JOIN productos pr ON pr.id_producto = d.id_producto
         WHERE d.id_pedido = ?`,
        [id_pedido],
        (err2, detalleRows) => {
          if (err2)
            return res.status(500).json({ ok: false, message: "Error al obtener detalle" });

          res.json({
            ok: true,
            pedido: pedidoRows[0],
            detalle: detalleRows
          });
        }
      );
    }
  );
};