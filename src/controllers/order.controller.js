const db = require("../config/db");

// ============================
// CREAR ORDEN (CLIENTE)
// ============================
const crearOrden = async (req, res) => {
  const usuario_id = req.user.id_usuario;
  const { negocio_id, items } = req.body;

  if (!negocio_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      ok: false,
      message: "Orden inválida"
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Validar que el negocio exista
    const [negocioRows] = await connection.query(
      "SELECT id FROM negocios WHERE id = ?",
      [negocio_id]
    );

    if (negocioRows.length === 0)
      throw new Error("Negocio no existe");

    let total = 0;

    // Validar productos y calcular total
    for (const item of items) {

      if (!item.producto_id || item.cantidad <= 0)
        throw new Error("Cantidad inválida");

      const [rows] = await connection.query(
        `SELECT precio, stock 
         FROM productos 
         WHERE id = ? AND negocio_id = ? AND estado = 1`,
        [item.producto_id, negocio_id]
      );

      if (rows.length === 0)
        throw new Error("Producto no encontrado o inactivo");

      if (rows[0].stock < item.cantidad)
        throw new Error("Stock insuficiente");

      total += rows[0].precio * item.cantidad;
    }

    // Crear orden
    const [ordenResult] = await connection.query(
      `INSERT INTO ordenes (usuario_id, negocio_id, total, estado)
       VALUES (?, ?, ?, 'pendiente')`,
      [usuario_id, negocio_id, total]
    );

    const orden_id = ordenResult.insertId;

    // Insertar detalle y descontar stock
    for (const item of items) {
      const [[producto]] = await connection.query(
        "SELECT precio FROM productos WHERE id = ?",
        [item.producto_id]
      );

      const subtotal = producto.precio * item.cantidad;

      await connection.query(
        `INSERT INTO detalle_orden
         (orden_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orden_id,
          item.producto_id,
          item.cantidad,
          producto.precio,
          subtotal
        ]
      );

      await connection.query(
        "UPDATE productos SET stock = stock - ? WHERE id = ?",
        [item.cantidad, item.producto_id]
      );
    }

    await connection.commit();

    res.json({
      ok: true,
      message: "Orden creada correctamente",
      orden_id
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      ok: false,
      message: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================
// ÓRDENES DEL CLIENTE
// ============================
const ordenesCliente = (req, res) => {
  const usuario_id = req.user.id_usuario;

  db.query(
    `SELECT id, total, estado, fecha_creacion
     FROM ordenes
     WHERE usuario_id = ?
     ORDER BY fecha_creacion DESC`,
    [usuario_id],
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al listar órdenes" });

      res.json({ ok: true, data: rows });
    }
  );
};

// ============================
// CAMBIAR ESTADO (DUEÑO NEGOCIO)
// ============================
const cambiarEstado = (req, res) => {
  const { id_orden } = req.params;
  const { estado } = req.body;
  const usuario_id = req.user.id_usuario;

  const estadosValidos = ["pendiente", "pagado", "cancelado"];

  if (!estadosValidos.includes(estado))
    return res.status(400).json({ ok: false, message: "Estado inválido" });

  db.query(
    `UPDATE ordenes o
     JOIN negocios n ON n.id = o.negocio_id
     SET o.estado = ?
     WHERE o.id = ? AND n.usuario_id = ?`,
    [estado, id_orden, usuario_id],
    (err, result) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al actualizar estado" });

      if (result.affectedRows === 0)
        return res.status(403).json({ ok: false, message: "No autorizado" });

      res.json({ ok: true, message: "Estado actualizado" });
    }
  );
};

// ============================
// ÓRDENES DEL NEGOCIO
// ============================
const ordenesNegocio = (req, res) => {
  const usuario_id = req.user.id_usuario;

  db.query(
    `SELECT 
       o.id,
       o.total,
       o.estado,
       o.fecha_creacion,
       u.nombre AS cliente
     FROM ordenes o
     JOIN negocios n ON n.id = o.negocio_id
     JOIN usuarios u ON u.id = o.usuario_id
     WHERE n.usuario_id = ?
     ORDER BY o.fecha_creacion DESC`,
    [usuario_id],
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al obtener órdenes" });

      res.json({
        ok: true,
        data: rows
      });
    }
  );
};

// ============================
// DETALLE ORDEN (CLIENTE)
// ============================
const detalleOrden = (req, res) => {
  const { id_orden } = req.params;
  const usuario_id = req.user.id_usuario;

  db.query(
    `SELECT o.id, o.total, o.estado, o.fecha_creacion,
            u.nombre AS cliente,
            n.nombre_negocio AS negocio
     FROM ordenes o
     JOIN usuarios u ON u.id = o.usuario_id
     JOIN negocios n ON n.id = o.negocio_id
     WHERE o.id = ? AND o.usuario_id = ?`,
    [id_orden, usuario_id],
    (err, ordenRows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al obtener orden" });

      if (ordenRows.length === 0)
        return res.status(404).json({ ok: false, message: "Orden no encontrada" });

      db.query(
        `SELECT p.nombre_producto, d.cantidad, d.precio_unitario, d.subtotal
         FROM detalle_orden d
         JOIN productos p ON p.id = d.producto_id
         WHERE d.orden_id = ?`,
        [id_orden],
        (err2, detalleRows) => {
          if (err2)
            return res.status(500).json({ ok: false, message: "Error al obtener detalle" });

          res.json({
            ok: true,
            orden: ordenRows[0],
            detalle: detalleRows
          });
        }
      );
    }
  );
};

module.exports = {
  crearOrden,
  ordenesCliente,
  ordenesNegocio,
  cambiarEstado,
  detalleOrden
};