const db = require("../config/db");

// ============================
// CREAR ORDEN (CLIENTE)
// ============================
const crearPedido = async (req, res) => {
  const usuario_id = req.user.id_usuario;
  const { negocio_id, items } = req.body;

  if (!negocio_id || !items || items.length === 0) {
    return res.status(400).json({
      ok: false,
      message: "Pedido inválido"
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let total = 0;

    // 1️⃣ Validar productos y calcular total
    for (const item of items) {
      const [rows] = await connection.query(
        `SELECT precio FROM productos 
         WHERE id = ? AND negocio_id = ?`,
        [item.producto_id, negocio_id]
      );

      if (rows.length === 0) {
        throw new Error("Producto no encontrado");
      }

      total += rows[0].precio * item.cantidad;
    }

    // 2️⃣ Crear orden
    const [ordenResult] = await connection.query(
      `INSERT INTO ordenes (usuario_id, negocio_id, total, estado)
       VALUES (?, ?, ?, 'pendiente')`,
      [usuario_id, negocio_id, total]
    );

    const orden_id = ordenResult.insertId;

    // 3️⃣ Insertar detalle
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
    }

    await connection.commit();

    res.json({
      ok: true,
      message: "Pedido creado correctamente",
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
// ÓRDENES DEL NEGOCIO
// ============================
const pedidosPorNegocio = (req, res) => {
  const usuario_id = req.user.id_usuario;

  // 1️⃣ Obtener negocio del usuario
  db.query(
    "SELECT id FROM negocios WHERE usuario_id = ?",
    [usuario_id],
    (err, negocioRows) => {
      if (err || negocioRows.length === 0) {
        return res.status(403).json({
          ok: false,
          message: "Negocio no encontrado"
        });
      }

      const negocio_id = negocioRows[0].id;

      // 2️⃣ Obtener órdenes
      db.query(
        `SELECT 
           o.id AS orden_id,
           o.total,
           o.estado,
           o.fecha_creacion,
           u.nombre AS cliente
         FROM ordenes o
         JOIN usuarios u ON u.id = o.usuario_id
         WHERE o.negocio_id = ?
         ORDER BY o.fecha_creacion DESC`,
        [negocio_id],
        (err2, rows) => {
          if (err2) {
            return res.status(500).json({
              ok: false,
              message: "Error al obtener pedidos"
            });
          }

          res.json({
            ok: true,
            pedidos: rows
          });
        }
      );
    }
  );
};

module.exports = {
  crearPedido,
  pedidosPorNegocio
};