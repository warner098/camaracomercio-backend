const db = require("../config/db");

// ============================
// CREAR ORDEN (CLIENTE)
// ============================
const crearOrden = async (req, res) => {
  const usuario_id = req.user.id_usuario;

  const {
    negocio_id,
    tipo_entrega,
    ciudad_destino,
    direccion_envio,
    metodo_pago,
    items
  } = req.body;

  if (!negocio_id || !tipo_entrega || !metodo_pago || !items || !items.length) {
    return res.status(400).json({ ok: false, message: "Datos incompletos" });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [negocioRows] = await connection.query(
      "SELECT id FROM negocios WHERE id = ? AND estado = 1",
      [negocio_id]
    );

    if (negocioRows.length === 0)
      throw new Error("Negocio no existe");

    let total = 0;

    for (const item of items) {

      if (!item.producto_id)
        throw new Error("Producto inválido");

      const [productoRows] = await connection.query(
        `SELECT precio, stock, tipo_venta
         FROM productos
         WHERE id = ? AND negocio_id = ? AND estado = 1`,
        [item.producto_id, negocio_id]
      );

      if (productoRows.length === 0)
        throw new Error("Producto no disponible");

      const producto = productoRows[0];

      let subtotal = 0;

      if (producto.tipo_venta === "unidad") {

        if (!item.cantidad || item.cantidad <= 0)
          throw new Error("Cantidad inválida");

        if (producto.stock < item.cantidad)
          throw new Error("Stock insuficiente");

        subtotal = producto.precio * item.cantidad;

      } else if (producto.tipo_venta === "peso") {

        if (!item.peso || item.peso <= 0)
          throw new Error("Peso inválido");

        if (producto.stock < item.peso)
          throw new Error("Stock insuficiente");

        subtotal = producto.precio * item.peso;
      }

      total += subtotal;
    }

    const [ordenResult] = await connection.query(
      `INSERT INTO ordenes
      (usuario_id, negocio_id, total, tipo_entrega, ciudad_destino,
       direccion_envio, estado, metodo_pago)
      VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)`,
      [
        usuario_id,
        negocio_id,
        total,
        tipo_entrega,
        ciudad_destino || null,
        direccion_envio || null,
        metodo_pago
      ]
    );

    const orden_id = ordenResult.insertId;

    for (const item of items) {

      const [[producto]] = await connection.query(
        "SELECT precio, tipo_venta FROM productos WHERE id = ?",
        [item.producto_id]
      );

      let subtotal = 0;

      if (producto.tipo_venta === "unidad") {
        subtotal = producto.precio * item.cantidad;

        await connection.query(
          "UPDATE productos SET stock = stock - ? WHERE id = ?",
          [item.cantidad, item.producto_id]
        );

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

      } else {

        subtotal = producto.precio * item.peso;

        await connection.query(
          "UPDATE productos SET stock = stock - ? WHERE id = ?",
          [item.peso, item.producto_id]
        );

        await connection.query(
          `INSERT INTO detalle_orden
           (orden_id, producto_id, peso, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [
            orden_id,
            item.producto_id,
            item.peso,
            producto.precio,
            subtotal
          ]
        );
      }
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
const detalleOrden = async (req, res) => {
  const { id_orden } = req.params;
  const usuario_id = req.user.id_usuario;
  const rol = req.user.rol;

  let query = `
    SELECT o.*, u.nombre AS cliente, n.nombre_negocio
    FROM ordenes o
    JOIN usuarios u ON u.id = o.usuario_id
    JOIN negocios n ON n.id = o.negocio_id
    WHERE o.id = ?
  `;

  let params = [id_orden];

  if (rol === "cliente") {
    query += " AND o.usuario_id = ?";
    params.push(usuario_id);
  }

  if (rol === "negocio") {
    query += " AND n.usuario_id = ?";
    params.push(usuario_id);
  }

  db.query(query, params, (err, ordenRows) => {

    if (err)
      return res.status(500).json({ ok: false, message: "Error al obtener orden" });

    if (ordenRows.length === 0)
      return res.status(404).json({ ok: false, message: "No autorizado o no existe" });

    db.query(
      `SELECT p.nombre_producto, d.cantidad, d.peso,
              d.precio_unitario, d.subtotal
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
  });
};

module.exports = {
  crearOrden,
  ordenesCliente,
  ordenesNegocio,
  cambiarEstado,
  detalleOrden
};