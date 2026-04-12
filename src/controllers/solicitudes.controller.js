const db = require("../config/db");

// ==========================
// CLIENTE ENVÍA SOLICITUD
// ==========================
exports.crearSolicitud = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const usuario_id = req.user.id_usuario;

    const {
      nombre_negocio,
      descripcion,
      ubicacion,
      telefono,
      categorias,
    } = req.body;

    // VALIDACIONES
    if (!nombre_negocio || !ubicacion || !telefono) {
      return res.status(400).json({
        ok: false,
        message: "Complete todos los campos obligatorios",
      });
    }

    if (!Array.isArray(categorias) || categorias.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Seleccione al menos una categoría",
      });
    }

    // VERIFICAR NEGOCIO EXISTENTE
    const [negocio] = await connection.query(
      "SELECT id FROM negocios WHERE usuario_id = ?",
      [usuario_id],
    );

    if (negocio.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "Ya tienes un negocio registrado",
      });
    }

    // VERIFICAR SOLICITUD PENDIENTE
    const [solicitud] = await connection.query(
      `SELECT id FROM solicitudes_negocio WHERE usuario_id = ? AND estado = 'pendiente'`,
      [usuario_id],
    );

    if (solicitud.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "Ya tienes una solicitud pendiente",
      });
    }

    // CREAR SOLICITUD
    const categoriaPrincipal = categorias[0]; 

    const [result] = await connection.query(
      `INSERT INTO solicitudes_negocio
       (usuario_id, nombre_negocio, descripcion, categoria, ubicacion, telefono, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
      [usuario_id, nombre_negocio, descripcion, categoriaPrincipal, ubicacion, telefono],
    );

    const solicitudId = result.insertId;

    // GUARDAR RELACIÓN CATEGORÍAS
    for (const cat of categorias) {
      await connection.query(
        `INSERT INTO solicitud_categorias (solicitud_id, categoria_id) VALUES (?, ?)`,
        [solicitudId, cat],
      );
    }

    return res.status(201).json({
      ok: true,
      message: "Solicitud enviada correctamente",
    });
  } catch (error) {
    console.error("ERROR CREAR SOLICITUD:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al enviar solicitud",
    });
  } finally {
    connection.release();
  }
};

exports.obtenerCategorias = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_categoria, nombre FROM categorias WHERE estado = 1",
    );
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error al obtener categorías" });
  }
};

exports.listarSolicitudes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.nombre, u.correo, u.rol
       FROM solicitudes_negocio s
       JOIN usuarios u ON u.id = s.usuario_id
       ORDER BY s.fecha_creacion DESC`,
    );
    return res.json({ ok: true, data: rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error al listar solicitudes" });
  }
};

exports.cambiarEstado = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id_solicitud } = req.params;
    const { estado } = req.body;

    if (!["aprobado", "rechazado"].includes(estado)) {
      return res.status(400).json({ ok: false, message: "Estado inválido" });
    }

    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT s.*, u.nombre AS dueno, u.correo AS email
       FROM solicitudes_negocio s
       JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.id = ?`,
      [id_solicitud],
    );

    if (rows.length === 0) throw new Error("Solicitud no encontrada");

    const solicitud = rows[0];

    await connection.query(
      "UPDATE solicitudes_negocio SET estado = ? WHERE id = ?",
      [estado, id_solicitud],
    );

    if (estado === "aprobado") {
      // 1. Cambiamos rol del usuario
      await connection.query(
        "UPDATE usuarios SET rol = 'negocio' WHERE id = ?",
        [solicitud.usuario_id],
      );

      // 2. Insertamos el nuevo negocio
      const [insertNegocio] = await connection.query(
        `INSERT INTO negocios
          (usuario_id, nombre_negocio, descripcion, categoria, ubicacion, telefono, dueno, email_contacto, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          solicitud.usuario_id,
          solicitud.nombre_negocio,
          solicitud.descripcion,
          solicitud.categoria,
          solicitud.ubicacion,
          solicitud.telefono,
          solicitud.dueno,
          solicitud.email,
        ],
      );

      const nuevoNegocioId = insertNegocio.insertId;

      // 3. Traspasamos las categorías de la solicitud al negocio definitivo
      const [categoriasSolicitud] = await connection.query(
        "SELECT categoria_id FROM solicitud_categorias WHERE solicitud_id = ?",
        [id_solicitud]
      );

      if (categoriasSolicitud.length > 0) {
        const values = categoriasSolicitud.map(cat => [nuevoNegocioId, cat.categoria_id]);
        await connection.query(
          "INSERT INTO negocio_categorias (negocio_id, categoria_id) VALUES ?",
          [values]
        );
      }
    }

    await connection.commit();

    return res.json({ ok: true, message: "Solicitud actualizada" });
  } catch (error) {
    await connection.rollback();
    console.error("ERROR CAMBIAR ESTADO SOLICITUD:", error);
    return res.status(500).json({ ok: false, message: error.message });
  } finally {
    connection.release();
  }
};