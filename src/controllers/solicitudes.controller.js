const db = require("../config/db");

// ==========================
// CLIENTE ENVÍA SOLICITUD
// ==========================
exports.crearSolicitud = (req, res) => {
  const usuario_id = req.user.id_usuario;
  const { nombre_negocio, descripcion, categoria, ubicacion, telefono } = req.body;

  if (!nombre_negocio)
    return res.status(400).json({ ok: false, message: "Nombre requerido" });

  db.query(
    `INSERT INTO solicitudes_negocio
     (usuario_id, nombre_negocio, descripcion, categoria, ubicacion, telefono, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
    [usuario_id, nombre_negocio, descripcion, categoria, ubicacion, telefono],
    (err) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al enviar solicitud" });

      res.json({ ok: true, message: "Solicitud enviada correctamente" });
    }
  );
};

// ==========================
// ADMIN LISTA SOLICITUDES
// ==========================
exports.listarSolicitudes = (req, res) => {
  db.query(
    `SELECT s.*, u.nombre, u.correo
     FROM solicitudes_negocio s
     JOIN usuarios u ON u.id = s.usuario_id
     ORDER BY s.fecha_creacion DESC`,
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al listar solicitudes" });

      res.json({ ok: true, data: rows });
    }
  );
};

// ==========================
// ADMIN APRUEBA / RECHAZA
// ==========================
exports.cambiarEstado = async (req, res) => {
  const { id_solicitud } = req.params;
  const { estado } = req.body;

  if (!["aprobado", "rechazado"].includes(estado))
    return res.status(400).json({ ok: false, message: "Estado inválido" });

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT * FROM solicitudes_negocio WHERE id = ?",
      [id_solicitud]
    );

    if (rows.length === 0)
      throw new Error("Solicitud no encontrada");

    const solicitud = rows[0];

    await connection.query(
      "UPDATE solicitudes_negocio SET estado = ? WHERE id = ?",
      [estado, id_solicitud]
    );

    if (estado === "aprobado") {

      // Cambiar rol del usuario
      await connection.query(
        "UPDATE usuarios SET rol = 'negocio' WHERE id = ?",
        [solicitud.usuario_id]
      );

      // Crear registro en tabla negocios
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

    res.json({ ok: true, message: "Solicitud actualizada" });

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