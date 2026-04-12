const pool = require("../config/db");

// ======================
// LISTAR PRODUCTOS (PÚBLICO)
// ======================

exports.listarTodos = async (req, res) => {
  try {
    const [productos] = await pool.query(`
      SELECT
<<<<<<< HEAD
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
=======
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
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
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
<<<<<<< HEAD
      id,
      nombre_producto,
      descripcion,
      precio,
      stock,
      foto,
      tipo_venta,
      unidad_medida
=======
        id,
        nombre_producto,
        descripcion,
        precio,
        stock,
        foto,
        tipo_venta,
        unidad_medida
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
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
<<<<<<< HEAD
          p.foto
       FROM productos p
       JOIN negocios n ON n.id = p.negocio_id
       WHERE n.usuario_id = ? 
       AND p.estado = 1`,
=======
          p.foto,
          p.estado -- 🔥 Agregamos el estado a la consulta
       FROM productos p
       JOIN negocios n ON n.id = p.negocio_id
       WHERE n.usuario_id = ?`, // 🔥 Quitamos el AND p.estado = 1
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
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
<<<<<<< HEAD
  ok: true,
  message: "Producto creado correctamente",
  id_producto: result.insertId
});
=======
      ok: true,
      message: "Producto creado correctamente",
      id_producto: result.insertId
    });
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)

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

    const foto = req.file?.path;

<<<<<<< HEAD
    // 🧠 QUERY BASE
=======
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
    let query = `
      UPDATE productos p
      JOIN negocios n ON n.id = p.negocio_id
      SET 
        p.nombre_producto = ?,
        p.descripcion = ?,
        p.tipo_venta = ?,
        p.precio = ?,
        p.unidad_medida = ?,
        p.stock = ?
    `;

    const params = [
      nombre_producto,
      descripcion,
      tipo_venta,
      precio,
      unidad_medida,
      stock
    ];

<<<<<<< HEAD
    // 🔥 SI VIENE IMAGEN → SE AGREGA
=======
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
    if (foto) {
      query += `, p.foto = ?`;
      params.push(foto);
    }

<<<<<<< HEAD
    query += `
      WHERE p.id = ? AND n.usuario_id = ? AND p.estado = 1
=======
    // 🔥 Modificado: Ya no exigimos que p.estado = 1 para poder editar
    query += `
      WHERE p.id = ? AND n.usuario_id = ?
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
    `;

    params.push(id_producto, id_usuario);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(403).json({
        ok: false,
<<<<<<< HEAD
        message: "No autorizado"
=======
        message: "No autorizado o el producto no existe"
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
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
<<<<<<< HEAD
// ELIMINAR PRODUCTO (SOFT)
=======
// ELIMINAR / DESACTIVAR PRODUCTO (SOFT)
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
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
<<<<<<< HEAD
      message: "Producto eliminado"
=======
      message: "Producto desactivado"
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
    });

  } catch (error) {
    console.error("ERROR ELIMINAR PRODUCTO:", error);
    return res.status(500).json({
      ok: false,
<<<<<<< HEAD
      message: "Error al eliminar producto"
=======
      message: "Error al desactivar producto"
    });
  }
};

// ======================
// ACTIVAR PRODUCTO
// ======================
// 🔥 NUEVA FUNCIÓN PARA REACTIVAR
exports.activar = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const id_usuario = req.user.id_usuario;

    const [result] = await pool.query(
      `UPDATE productos p
       JOIN negocios n ON n.id = p.negocio_id
       SET p.estado = 1
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
      message: "Producto activado nuevamente"
    });

  } catch (error) {
    console.error("ERROR ACTIVAR PRODUCTO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al activar producto"
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
    });
  }
};