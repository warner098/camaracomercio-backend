const db = require("../config/db");

// ======================
// LISTAR NEGOCIOS (PÚBLICO)
// ======================
exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nombre_negocio, descripcion, ubicacion FROM negocios WHERE estado = 1"
    );

    return res.json({
      ok: true,
      data: rows,
    });

  } catch (error) {
    console.error("ERROR LISTAR NEGOCIOS:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar negocios",
    });
  }
};

// ======================
// DETALLE DE NEGOCIO
// ======================
exports.detalle = async (req, res) => {
  try {
    const { id_negocio } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM negocios WHERE id = ? AND estado = 1",
      [id_negocio]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Negocio no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: rows[0],
    });

  } catch (error) {
    console.error("ERROR DETALLE NEGOCIO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener negocio",
    });
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
      return res.status(400).json({
        ok: false,
        message: "Nombre requerido",
      });
    }

    await db.query(
      `INSERT INTO negocios
       (nombre_negocio, descripcion, ubicacion, telefono, usuario_id, estado)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        nombre,
        descripcion || null,
        direccion || null,
        telefono || null,
        id_usuario,
      ]
    );

    return res.status(201).json({
      ok: true,
      message: "Negocio creado correctamente",
    });

  } catch (error) {
    console.error("ERROR CREAR NEGOCIO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear negocio",
    });
  }
};

// ======================
// EDITAR NEGOCIO
// ======================
exports.editar = async (req, res) => {
  try {
    const { id_negocio } = req.params;
    const id_usuario = req.user.id_usuario;
    const { nombre, descripcion, direccion, telefono } = req.body;

    const [result] = await db.query(
      `UPDATE negocios 
       SET nombre_negocio = ?, descripcion = ?, ubicacion = ?, telefono = ?
       WHERE id = ? AND usuario_id = ?`,
      [nombre, descripcion, direccion, telefono, id_negocio, id_usuario]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({
        ok: false,
        message: "No autorizado o negocio no existe",
      });
    }

    return res.json({
      ok: true,
      message: "Negocio actualizado",
    });

  } catch (error) {
    console.error("ERROR EDITAR NEGOCIO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al editar negocio",
    });
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
      return res.status(403).json({
        ok: false,
        message: "No autorizado o negocio no existe",
      });
    }

    return res.json({
      ok: true,
      message: "Negocio eliminado",
    });

  } catch (error) {
    console.error("ERROR ELIMINAR NEGOCIO:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar negocio",
    });
  }
};