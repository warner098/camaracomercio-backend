const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");

// ======================
// HELPER: BORRAR IMAGEN DE CLOUDINARY
// ======================
const borrarDeCloudinary = async (urlFoto) => {
  if (!urlFoto) return;
  try {
    const partes = urlFoto.split('/');
    const archivoConExtension = partes[partes.length - 1];
    const nombreArchivo = archivoConExtension.split('.')[0];
    // Asume que la carpeta en Cloudinary se llama "productos" según tu config de multer
    const publicId = `productos/${nombreArchivo}`; 
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error borrando imagen antigua de Cloudinary:", error);
  }
};

// ======================
// LISTAR PRODUCTOS (PÚBLICO)
// ======================
exports.listarTodos = async (req, res) => {
  try {
    // Parámetros de la URL: ?page=1&limit=10
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [productos] = await pool.query(`
      SELECT p.id, p.nombre_producto, p.descripcion, p.precio, p.stock, p.foto, p.tipo_venta, p.unidad_medida, n.nombre_negocio
      FROM productos p
      JOIN negocios n ON p.negocio_id = n.id
      WHERE p.estado = 1
      LIMIT ? OFFSET ?
    `, [limit, offset]); 

    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM productos WHERE estado = 1");

    return res.json({ 
      ok: true, 
      data: productos, 
      paginacion: { total, page, limit, paginas: Math.ceil(total / limit) } 
    });
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
          p.foto,
          p.estado
       FROM productos p
       JOIN negocios n ON n.id = p.negocio_id
       WHERE n.usuario_id = ?`,
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

    const foto = req.file?.path;

    // 🔥 SI HAY UNA FOTO NUEVA, BUSCAMOS LA VIEJA Y LA BORRAMOS DE CLOUDINARY
    if (foto) {
      const [productoRow] = await pool.query("SELECT foto FROM productos WHERE id = ?", [id_producto]);
      if (productoRow.length > 0 && productoRow[0].foto) {
        await borrarDeCloudinary(productoRow[0].foto);
      }
    }

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

    if (foto) {
      query += `, p.foto = ?`;
      params.push(foto);
    }

    query += ` WHERE p.id = ? AND n.usuario_id = ?`;

    params.push(id_producto, id_usuario);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(403).json({
        ok: false,
        message: "No autorizado o el producto no existe"
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
// ELIMINAR / DESACTIVAR PRODUCTO (SOFT)
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
      message: "Producto desactivado"
    });

  } catch (error) {
    console.error("ERROR ELIMINAR PRODUCTO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al desactivar producto"
    });
  }
};

// ======================
// ACTIVAR PRODUCTO
// ======================
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
    });
  }
};