const db = require("../config/db");

// ======================
// LISTAR PRODUCTOS (PÚBLICO)
// ======================
exports.listarPorNegocio = (req, res) => {
  const { id_negocio } = req.params;

  db.query(
    `SELECT id_producto, nombre_producto, descripcion, precio, stock, foto
     FROM productos
     WHERE negocio_id = ? AND estado = 1`,
    [id_negocio],
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al listar productos" });

      res.json({ ok: true, data: rows });
    }
  );
};

exports.listarMisProductos = (req, res) => {
  const id_usuario = req.user.id_usuario;

  db.query(
    `SELECT 
        p.id_producto,
        p.nombre_producto,
        p.descripcion,
        p.tipo_venta,
        p.precio,
        p.unidad_medida,
        p.stock,
        p.foto
     FROM productos p
     JOIN negocios n ON n.id_negocio = p.negocio_id
     WHERE n.id_usuario = ? AND p.estado = 1`,
    [id_usuario],
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al listar productos" });

      res.json({ ok: true, data: rows });
    }
  );
};

// ======================
// CREAR PRODUCTO
// ======================
exports.crear = (req, res) => {
  const id_usuario = req.user.id_usuario;
  const {
    nombre_producto,
    descripcion,
    tipo_venta,
    precio,
    unidad_medida,
    stock
  } = req.body;

  const foto = req.file?.path || null;

  db.query(
    "SELECT id_negocio FROM negocios WHERE id_usuario = ?",
    [id_usuario],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(403).json({ ok: false, message: "No autorizado" });

      const negocio_id = result[0].id_negocio;

      db.query(
        `INSERT INTO productos
        (negocio_id, nombre_producto, descripcion, tipo_venta, precio, unidad_medida, stock, foto)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          negocio_id,
          nombre_producto,
          descripcion,
          tipo_venta,
          precio,
          unidad_medida,
          stock || 0,
          foto
        ],
        (err2) => {
          if (err2)
            return res.status(500).json({ ok: false, message: "Error al crear producto" });

          res.json({ ok: true, message: "Producto creado correctamente" });
        }
      );
    }
  );
};

// ======================
// EDITAR PRODUCTO
// ======================
exports.editar = (req, res) => {
  const { id_producto } = req.params;
  const id_usuario = req.user.id_usuario;

  const {
    nombre_producto,
    descripcion,
    tipo_venta,
    precio,
    unidad_medida,
    stock
  } = req.body;

  db.query(
    `UPDATE productos p
     JOIN negocios n ON n.id_negocio = p.negocio_id
     SET 
        p.nombre_producto = ?,
        p.descripcion = ?,
        p.tipo_venta = ?,
        p.precio = ?,
        p.unidad_medida = ?,
        p.stock = ?
     WHERE p.id_producto = ? AND n.id_usuario = ?`,
    [
      nombre_producto,
      descripcion,
      tipo_venta,
      precio,
      unidad_medida,
      stock,
      id_producto,
      id_usuario
    ],
    (err, result) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al editar producto" });

      if (result.affectedRows === 0)
        return res.status(403).json({ ok: false, message: "No autorizado" });

      res.json({ ok: true, message: "Producto actualizado" });
    }
  );
};

// ======================
// ELIMINAR PRODUCTO (SOFT)
// ======================
exports.eliminar = (req, res) => {
  const { id_producto } = req.params;
  const id_usuario = req.user.id_usuario;

  db.query(
    `UPDATE productos p
     JOIN negocios n ON n.id_negocio = p.negocio_id
     SET p.estado = 0
     WHERE p.id_producto = ? AND n.id_usuario = ?`,
    [id_producto, id_usuario],
    (err, result) => {
      if (err) {
        console.error(err); // 👈 agrega esto para ver errores en Render
        return res.status(500).json({ ok: false, message: "Error al eliminar producto" });
      }

      if (result.affectedRows === 0)
        return res.status(403).json({ ok: false, message: "No autorizado" });

      res.json({ ok: true, message: "Producto eliminado" });
    }
  );
};