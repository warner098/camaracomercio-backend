const db = require("../config/db");

// ======================
// LISTAR NEGOCIOS (PÚBLICO)
// ======================
exports.listar = async (req, res) => {
  try {
    // Usamos GROUP_CONCAT para unir los nombres de las categorías de la tabla intermedia
    const [rows] = await db.query(
      `SELECT 
        n.id, 
        n.nombre_negocio, 
        n.descripcion, 
        n.usuario_id,
        GROUP_CONCAT(c.nombre SEPARATOR ', ') AS categoria, 
        n.logo, 
        n.banner, 
        n.ubicacion 
      FROM negocios n
      LEFT JOIN negocio_categorias nc ON n.id = nc.negocio_id
      LEFT JOIN categorias c ON nc.categoria_id = c.id_categoria
      WHERE n.estado = 1
      GROUP BY n.id`
    );

    return res.json({ ok: true, data: rows });
  } catch (error) {
    console.error("ERROR LISTAR NEGOCIOS:", error);
    return res.status(500).json({ ok: false, message: "Error al listar negocios" });
  }
};

// ======================
// DETALLE DE NEGOCIO
// ======================
exports.detalle = async (req, res) => {
  try {
    const { id_negocio } = req.params;

    const [rows] = await db.query(
      `SELECT 
        n.*, 
        GROUP_CONCAT(c.nombre SEPARATOR ', ') AS categoria
      FROM negocios n
      LEFT JOIN negocio_categorias nc ON n.id = nc.negocio_id
      LEFT JOIN categorias c ON nc.categoria_id = c.id_categoria
      WHERE n.id = ? AND n.estado = 1
      GROUP BY n.id`,
      [id_negocio]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, message: "Negocio no encontrado" });
    }

    return res.json({ ok: true, data: rows[0] });
  } catch (error) {
    console.error("ERROR DETALLE NEGOCIO:", error);
    return res.status(500).json({ ok: false, message: "Error al obtener negocio" });
  }
};

// ======================
// CREAR NEGOCIO
// ======================
exports.crear = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    const { nombre, descripcion, direccion, telefono } = req.body;

    if (!nombre) {
      return res.status(400).json({ ok: false, message: "Nombre requerido" });
    }

    await db.query(
      `INSERT INTO negocios
       (nombre_negocio, descripcion, ubicacion, telefono, usuario_id, estado)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [nombre, descripcion || null, direccion || null, telefono || null, id_usuario]
    );

    return res.status(201).json({ ok: true, message: "Negocio creado correctamente" });
  } catch (error) {
    console.error("ERROR CREAR NEGOCIO:", error);
    return res.status(500).json({ ok: false, message: "Error al crear negocio" });
  }
};

// ======================
// OBTENER MI NEGOCIO (DUEÑO)
// ======================
exports.miNegocio = async (req, res) => {
  try {
    const usuario_id = req.user.id_usuario;

    const [negociosRows] = await db.query(
      `SELECT * FROM negocios WHERE usuario_id = ? AND estado = 1`,
      [usuario_id]
    );

    if (!negociosRows.length) {
      return res.status(404).json({ ok: false, message: "No tienes un negocio registrado" });
    }

    const negocio = negociosRows[0];

    // Buscamos sus categorías asignadas para devolver el arreglo de IDs
    const [catRows] = await db.query(
      `SELECT categoria_id FROM negocio_categorias WHERE negocio_id = ?`,
      [negocio.id]
    );

    negocio.categorias = catRows.map(c => c.categoria_id);

    res.json({ ok: true, data: negocio });
  } catch (error) {
    console.error("Error en miNegocio:", error);
    res.status(500).json({ ok: false, message: "Error servidor" });
  }
};

// ======================
// EDITAR NEGOCIO
// ======================
exports.editar = async (req, res) => {
  try {
    const { id_negocio } = req.params;
    const id_usuario = req.user.id_usuario;
    
    const { 
      nombre_negocio, descripcion, ubicacion, telefono, 
      email_contacto, horarios, facebook, instagram,
      tiktok, x_twitter, youtube, whatsapp, telegram,
      payphone_id, costo_delivery, categorias // 🔥 Agregado costo_delivery
    } = req.body;

    let query = `
      UPDATE negocios 
      SET 
        nombre_negocio = ?, descripcion = ?, ubicacion = ?, telefono = ?,
        email_contacto = ?, horarios = ?, facebook = ?, instagram = ?,
        tiktok = ?, x_twitter = ?, youtube = ?, whatsapp = ?, telegram = ?,
        payphone_id = ?, costo_delivery = ?
      WHERE id = ? AND usuario_id = ?
    `;

    const params = [
      nombre_negocio, descripcion || null, ubicacion, telefono, 
      email_contacto || null, horarios || null, facebook || null, instagram || null, 
      tiktok || null, x_twitter || null, youtube || null, whatsapp || null, telegram || null,
      payphone_id || null, 
      costo_delivery || 0, // 🔥 Aseguramos que sea un número
      id_negocio, id_usuario
    ];

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(403).json({ ok: false, message: "No autorizado o negocio no existe" });
    }

    // Actualizamos las categorías (esto se mantiene igual)
    await db.query(`DELETE FROM negocio_categorias WHERE negocio_id = ?`, [id_negocio]);

    if (categorias && categorias.length > 0) {
      const values = categorias.map(cat_id => [id_negocio, cat_id]);
      await db.query(`INSERT INTO negocio_categorias (negocio_id, categoria_id) VALUES ?`, [values]);
    }

    return res.json({ ok: true, message: "Información actualizada correctamente" });
  } catch (error) {
    console.error("ERROR EDITAR NEGOCIO:", error);
    return res.status(500).json({ ok: false, message: "Error al actualizar la información" });
  }
};

// ======================
// ELIMINAR NEGOCIO (SOFT DELETE)
// ======================
exports.eliminar = async (req, res) => {
  try {
    const { id_negocio } = req.params;
    const id_usuario = req.user.id_usuario;

    const [result] = await db.query(
      "UPDATE negocios SET estado = 0 WHERE id = ? AND usuario_id = ?",
      [id_negocio, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ ok: false, message: "No autorizado" });
    }

    return res.json({ ok: true, message: "Negocio eliminado" });
  } catch (error) {
    console.error("ERROR ELIMINAR NEGOCIO:", error);
    return res.status(500).json({ ok: false, message: "Error al eliminar negocio" });
  }
};

// ======================
// ACTUALIZAR CONFIG PAGO
// ======================
exports.actualizarConfigPago = async (req, res) => {
  try {
    const { id_negocio } = req.params;
    const { payphone_id } = req.body;
    const usuario_id = req.user.id_usuario;

    const [result] = await db.query(
      "UPDATE negocios SET payphone_id = ? WHERE id = ? AND usuario_id = ?",
      [payphone_id, id_negocio, usuario_id]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ ok: false, message: "No autorizado" });
    }

    res.json({ ok: true, message: "Configuración de pago actualizada" });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error al actualizar" });
  }
};

// ======================
// ACTUALIZAR SOLO IMÁGENES (LOGO Y BANNER)
// ======================
exports.actualizarImagenes = async (req, res) => {
  try {
    const { id_negocio } = req.params;
    const id_usuario = req.user.id_usuario;
    
    const logo = req.files?.logo ? req.files.logo[0].path : null;
    const banner = req.files?.banner ? req.files.banner[0].path : null;

    if (!logo && !banner) {
      return res.status(400).json({ ok: false, message: "No se enviaron imágenes" });
    }

    let updates = [];
    const params = [];

    if (logo) {
      updates.push("logo = ?");
      params.push(logo);
    }
    
    if (banner) {
      updates.push("banner = ?");
      params.push(banner);
    }

    const query = `UPDATE negocios SET ${updates.join(', ')} WHERE id = ? AND usuario_id = ?`;
    params.push(id_negocio, id_usuario);

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(403).json({ ok: false, message: "No autorizado" });
    }

    return res.json({ ok: true, message: "Imágenes actualizadas", logo, banner });
  } catch (error) {
    console.error("ERROR ACTUALIZAR IMÁGENES:", error);
    return res.status(500).json({ ok: false, message: "Error al actualizar imágenes" });
  }
};

// ======================
// PANEL ADMIN: LISTAR TODOS LOS NEGOCIOS
// ======================
exports.listarAdmin = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        n.id, n.nombre_negocio, n.ubicacion, n.telefono, n.estado,
        u.nombre AS dueno_nombre, u.correo AS dueno_correo,
        GROUP_CONCAT(c.nombre SEPARATOR ', ') AS categoria
      FROM negocios n
      LEFT JOIN usuarios u ON n.usuario_id = u.id
      LEFT JOIN negocio_categorias nc ON n.id = nc.negocio_id
      LEFT JOIN categorias c ON nc.categoria_id = c.id_categoria
      GROUP BY n.id
      ORDER BY n.fecha_creacion DESC`
    );
    return res.json({ ok: true, data: rows });
  } catch (error) {
    console.error("ERROR LISTAR NEGOCIOS ADMIN:", error);
    return res.status(500).json({ ok: false, message: "Error al listar negocios para admin" });
  }
};

// ======================
// PANEL ADMIN: CAMBIAR ESTADO DE NEGOCIO
// ======================
exports.toggleEstadoAdmin = async (req, res) => {
  try {
    const { id_negocio } = req.params;
    const { estado } = req.body; 

    const [result] = await db.query(
      "UPDATE negocios SET estado = ? WHERE id = ?",
      [estado, id_negocio]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "Negocio no encontrado" });
    }

    return res.json({ ok: true, message: `Negocio ${estado === 1 ? 'reactivado' : 'suspendido'} correctamente` });
  } catch (error) {
    console.error("ERROR TOGGLE ESTADO NEGOCIO:", error);
    return res.status(500).json({ ok: false, message: "Error al cambiar estado del negocio" });
  }
};