const pool = require("../config/db");
// LISTAR PRODUCTOS (PÚBLICO)
// ======================

exports.listarTodos = async (req, res) => {
  try {
    const [productos] = await pool.query(`
      SELECT p.*, n.nombre_negocio AS negocio_nombre
      FROM productos p
      JOIN negocios n ON p.negocio_id = n.id
    `);

    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
};

exports.listarPorNegocio = async (req, res) => {
  try {
    const { id_negocio } = req.params;

    const [rows] = await pool.query(
      `SELECT id, nombre_producto, descripcion, precio, stock, foto
       FROM productos
       WHERE negocio_id = ? AND estado = 1`,
      [id_negocio]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al listar productos" });
  }
};

exports.listarMisProductos = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    const [rows] = await pool.query(
      `SELECT 
          p.id,
          p.nombre_producto,
          p.descripcion,
          p.tipo_venta,
          p.precio,
          p.unidad_medida,
          p.stock,
          p.foto
       FROM productos p
       JOIN negocios n ON n.id = p.negocio_id
       WHERE n.usuario_id = ? 
       AND p.estado = 1`,
      [id_usuario]
    );

    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error SQL" });
  }
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

  // Primero buscamos el negocio del usuario
  db.query(
    "SELECT id FROM negocios WHERE usuario_id = ?",
    [id_usuario],
    (err, rows) => {

      if (err) {
        console.log(err);
        return res.status(500).json({ ok: false, message: "Error servidor" });
      }

      if (rows.length === 0) {
        return res.status(403).json({ ok: false, message: "No tiene negocio registrado" });
      }

      const negocio_id = rows[0].id;

      // Ahora insertamos el producto
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

          if (err2) {
            console.log(err2);
            return res.status(500).json({ ok: false, message: "Error al crear producto" });
          }

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
     JOIN negocios n ON n.id = p.negocio_id
     SET 
        p.nombre_producto = ?,
        p.descripcion = ?,
        p.tipo_venta = ?,
        p.precio = ?,
        p.unidad_medida = ?,
        p.stock = ?
     WHERE p.id = ? AND n.usuario_id = ?`,
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
      if (err) {
        console.log(err);
        return res.status(500).json({ ok: false, message: "Error al editar producto" });
      }

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
     JOIN negocios n ON n.id = p.negocio_id
     SET p.estado = 0
     WHERE p.id = ? AND n.usuario_id = ?`,
    [id_producto, id_usuario],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ ok: false, message: "Error al eliminar producto" });
      }

      if (result.affectedRows === 0)
        return res.status(403).json({ ok: false, message: "No autorizado" });

      res.json({ ok: true, message: "Producto eliminado" });
    }
  );
};