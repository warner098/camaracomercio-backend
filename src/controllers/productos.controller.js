const pool = require("../config/db");

// ======================
// LISTAR PRODUCTOS (PÚBLICO)
// ======================

exports.listarTodos = async (req, res) => {
  try {
    const [productos] = await pool.query(`
      SELECT
p.id,
p.nombre_producto,
p.descripcion,
p.precio,
p.stock,
p.foto,
p.tipo_venta,
p.unidad_medida,
n.nombre_negocio
FROM productos p
JOIN negocios n ON p.negocio_id = n.id
WHERE p.estado = 1
    `);

    return res.json({ ok: true, data: productos });

  } catch (error) {
    console.error("ERROR LISTAR TODOS:", error);
    return res.status(500).json({ ok: false, message: "Error al obtener productos" });
  }
};

exports.listarPorNegocio = async (req, res) => {
  try {
    const { id_negocio } = req.params;

    const [rows] = await pool.query(
      `SELECT
      id,
      nombre_producto,
      descripcion,
      precio,
      stock,
      foto,
      tipo_venta,
      unidad_medida
       FROM productos
       WHERE negocio_id = ? AND estado = 1`,
      [id_negocio]
    );

    return res.json({ ok: true, data: rows });

  } catch (error) {
    console.error("ERROR LISTAR POR NEGOCIO:", error);
    return res.status(500).json({ ok: false, message: "Error al listar productos" });
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

    return res.json({ ok: true, data: rows });

  } catch (error) {
    console.error("ERROR LISTAR MIS PRODUCTOS:", error);
    return res.status(500).json({ ok: false, message: "Error SQL" });
  }
};

// ======================
// CREAR PRODUCTO
// ======================

exports.crear = async (req, res) => {
  try {
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

    const [negocioRows] = await pool.query(
      "SELECT id FROM negocios WHERE usuario_id = ? AND estado = 1",
      [id_usuario]
    );

    if (negocioRows.length === 0) {
      return res.status(403).json({
        ok: false,
        message: "No tiene negocio registrado"
      });
    }

    const negocio_id = negocioRows[0].id;

    const [result] = await pool.query(
      `INSERT INTO productos
       (negocio_id, nombre_producto, descripcion, tipo_venta, precio, unidad_medida, stock, foto, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        negocio_id,
        nombre_producto,
        descripcion,
        tipo_venta,
        precio,
        unidad_medida,
        stock || 0,
        foto
      ]
    );

    return res.status(201).json({
  ok: true,
  message: "Producto creado correctamente",
  id_producto: result.insertId
});

  } catch (error) {
    console.error("ERROR CREAR PRODUCTO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear producto"
    });
  }
};

// ======================
// EDITAR PRODUCTO
// ======================

exports.editar = async (req, res) => {
  try {
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

    const [result] = await pool.query(
      `UPDATE productos p
       JOIN negocios n ON n.id = p.negocio_id
       SET 
          p.nombre_producto = ?,
          p.descripcion = ?,
          p.tipo_venta = ?,
          p.precio = ?,
          p.unidad_medida = ?,
          p.stock = ? 
       WHERE p.id = ? AND n.usuario_id = ? AND p.estado = 1`,
      [
        nombre_producto,
        descripcion,
        tipo_venta,
        precio,
        unidad_medida,
        stock,
        id_producto,
        id_usuario
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({
        ok: false,
        message: "No autorizado"
      });
    }

    return res.json({
      ok: true,
      message: "Producto actualizado"
    });

  } catch (error) {
    console.error("ERROR EDITAR PRODUCTO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al editar producto"
    });
  }
};

// ======================
// ELIMINAR PRODUCTO (SOFT)
// ======================

exports.eliminar = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const id_usuario = req.user.id_usuario;

    const [result] = await pool.query(
      `UPDATE productos p
       JOIN negocios n ON n.id = p.negocio_id
       SET p.estado = 0
       WHERE p.id = ? AND n.usuario_id = ?`,
      [id_producto, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({
        ok: false,
        message: "No autorizado"
      });
    }

    return res.json({
      ok: true,
      message: "Producto eliminado"
    });

  } catch (error) {
    console.error("ERROR ELIMINAR PRODUCTO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar producto"
    });
  }
};