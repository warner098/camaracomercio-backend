const db = require("../config/db");

// ======================
// LISTAR CATEGORÍAS
// ======================
exports.listar = (req, res) => {
  db.query(
    "SELECT id_categoria, nombre FROM categorias WHERE estado = 1",
    (err, rows) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al listar categorías" });

      res.json({ ok: true, data: rows });
    }
  );
};

// ======================
// CREAR
// ======================
exports.crear = (req, res) => {
  const { nombre } = req.body;

  if (!nombre)
    return res.status(400).json({ ok: false, message: "Nombre requerido" });

  db.query(
    "INSERT INTO categorias (nombre) VALUES (?)",
    [nombre],
    (err) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al crear categoría" });

      res.json({ ok: true, message: "Categoría creada" });
    }
  );
};

// ======================
// EDITAR
// ======================
exports.editar = (req, res) => {
  const { id_categoria } = req.params;
  const { nombre } = req.body;

  db.query(
    "UPDATE categorias SET nombre = ? WHERE id_categoria = ?",
    [nombre, id_categoria],
    (err, result) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al editar categoría" });

      if (result.affectedRows === 0)
        return res.status(404).json({ ok: false, message: "Categoría no encontrada" });

      res.json({ ok: true, message: "Categoría actualizada" });
    }
  );
};

// ======================
// ELIMINAR (SOFT)
// ======================
exports.eliminar = (req, res) => {
  const { id_categoria } = req.params;

  db.query(
    "UPDATE categorias SET estado = 0 WHERE id_categoria = ?",
    [id_categoria],
    (err, result) => {
      if (err)
        return res.status(500).json({ ok: false, message: "Error al eliminar categoría" });

      if (result.affectedRows === 0)
        return res.status(404).json({ ok: false, message: "Categoría no encontrada" });

      res.json({ ok: true, message: "Categoría eliminada" });
    }
  );
};