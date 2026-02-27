const db = require("../config/db");

// ======================
// LISTAR NEGOCIOS (PÚBLICO)
// ======================
exports.listar = (req, res) => {
  db.query(
    "SELECT id, nombre_negocio, descripcion, ubicacion FROM negocios WHERE estado = 1",
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al listar negocios" });

      res.json({ ok: true, data: rows });
    }
  );
};

// ======================
// DETALLE DE NEGOCIO
// ======================
exports.detalle = (req, res) => {
  const { id_negocio } = req.params;

  db.query(
    "SELECT * FROM negocios WHERE id = ? AND estado = 1",
    [id_negocio],
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al obtener negocio" });

      if (rows.length === 0)
        return res.status(404).json({ ok: false, message: "Negocio no encontrado" });

      res.json({ ok: true, data: rows[0] });
    }
  );
};

// ======================
// CREAR NEGOCIO
// ======================
exports.crear = (req, res) => {
  const id_usuario = req.user.id_usuario;
  const { nombre, descripcion, direccion, telefono } = req.body;

  if (!nombre)
    return res.status(400).json({ ok: false, message: "Nombre requerido" });

  db.query(
    `INSERT INTO negocios
     (nombre_negocio, descripcion, ubicacion, telefono, usuario_id)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, descripcion || null, direccion || null, telefono || null, id_usuario],
    (err) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al crear negocio" });

      res.json({ ok: true, message: "Negocio creado correctamente" });
    }
  );
};

// ======================
// EDITAR NEGOCIO
// ======================
exports.editar = (req, res) => {
  const { id_negocio } = req.params;
  const id_usuario = req.user.id_usuario;
  const { nombre, descripcion, direccion, telefono } = req.body;

  db.query(
    `UPDATE negocios 
     SET nombre_negocio = ?, descripcion = ?, ubicacion = ?, telefono = ?
     WHERE id = ? AND usuario_id = ?`,
    [nombre, descripcion, direccion, telefono, id_negocio, id_usuario],
    (err, result) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al editar negocio" });

      if (result.affectedRows === 0)
        return res.status(403).json({ ok: false, message: "No autorizado" });

      res.json({ ok: true, message: "Negocio actualizado" });
    }
  );
};

// ======================
// ELIMINAR NEGOCIO (SOFT DELETE)
// ======================
exports.eliminar = (req, res) => {
  const { id_negocio } = req.params;
  const id_usuario = req.user.id_usuario;

  db.query(
    "UPDATE negocios SET estado = 0 WHERE id = ? AND usuario_id = ?",
    [id_negocio, id_usuario],
    (err, result) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al eliminar negocio" });

      if (result.affectedRows === 0)
        return res.status(403).json({ ok: false, message: "No autorizado" });

      res.json({ ok: true, message: "Negocio eliminado" });
    }
  );
};