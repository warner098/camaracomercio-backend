const db = require("../config/db");

// ==========================
// CLIENTE ENVÍA SOLICITUD
// ==========================
exports.crearSolicitud = async (req, res) => {
  try {
    const usuario_id = req.user.id_usuario;
    const { nombre_negocio, descripcion, categoria, ubicacion, telefono } = req.body;

    if (!nombre_negocio) {
      return res.status(400).json({
        ok: false,
        message: "Nombre requerido"
      });
    }

    await db.query(
      `INSERT INTO solicitudes_negocio
       (usuario_id, nombre_negocio, descripcion, categoria, ubicacion, telefono, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
      [usuario_id, nombre_negocio, descripcion, categoria, ubicacion, telefono]
    );

    return res.status(201).json({
      ok: true,
      message: "Solicitud enviada correctamente"
    });

  } catch (error) {
    console.error("ERROR CREAR SOLICITUD:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al enviar solicitud"
    });
  }
};

// ==========================
// ADMIN LISTA SOLICITUDES
// ==========================
exports.listarSolicitudes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.nombre, u.correo
       FROM solicitudes_negocio s
       JOIN usuarios u ON u.id = s.usuario_id
       ORDER BY s.fecha_creacion DESC`
    );

    return res.json({
      ok: true,
      data: rows
    });

  } catch (error) {
    console.error("ERROR LISTAR SOLICITUDES:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar solicitudes"
    });
  }
};

// ==========================
// ADMIN APRUEBA / RECHAZA
// ==========================
exports.cambiarEstado = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id_solicitud } = req.params;
    const { estado } = req.body;

    if (!["aprobado", "rechazado"].includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: "Estado inválido"
      });
    }

    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT * FROM solicitudes_negocio WHERE id = ?",
      [id_solicitud]
    );

    if (rows.length === 0) {
      throw new Error("Solicitud no encontrada");
    }

    const solicitud = rows[0];

    await connection.query(
      "UPDATE solicitudes_negocio SET estado = ? WHERE id = ?",
      [estado, id_solicitud]
    );

    if (estado === "aprobado") {
      await connection.query(
        "UPDATE usuarios SET rol = 'negocio' WHERE id = ?",
        [solicitud.usuario_id]
      );

      await connection.query(
        `INSERT INTO negocios
         (usuario_id, nombre_negocio, descripcion, categoria, ubicacion, telefono, estado)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          solicitud.usuario_id,
          solicitud.nombre_negocio,
          solicitud.descripcion,
          solicitud.categoria,
          solicitud.ubicacion,
          solicitud.telefono
        ]
      );
    }

    await connection.commit();

    return res.json({
      ok: true,
      message: "Solicitud actualizada"
    });

  } catch (error) {
    await connection.rollback();
    console.error("ERROR CAMBIAR ESTADO SOLICITUD:", error);

    return res.status(500).json({
      ok: false,
      message: error.message
    });

  } finally {
    connection.release();
  }
};