const db = require("../config/db");

// ======================
// LISTAR CATEGORÍAS
// ======================
exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id_categoria, nombre FROM categorias WHERE estado = 1"
    );

    return res.json({
      ok: true,
      data: rows,
    });

  } catch (error) {
    console.error("ERROR LISTAR CATEGORIAS:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar categorías",
    });
  }
};

// ======================
// CREAR
// ======================
exports.crear = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        message: "Nombre requerido",
      });
    }

    await db.query(
      "INSERT INTO categorias (nombre, estado) VALUES (?, 1)",
      [nombre]
    );

    return res.status(201).json({
      ok: true,
      message: "Categoría creada",
    });

  } catch (error) {
    console.error("ERROR CREAR CATEGORIA:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al crear categoría",
    });
  }
};

// ======================
// EDITAR
// ======================
exports.editar = async (req, res) => {
  try {
    const { id_categoria } = req.params;
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        message: "Nombre requerido",
      });
    }

    const [result] = await db.query(
      "UPDATE categorias SET nombre = ? WHERE id_categoria = ?",
      [nombre, id_categoria]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Categoría no encontrada",
      });
    }

    return res.json({
      ok: true,
      message: "Categoría actualizada",
    });

  } catch (error) {
    console.error("ERROR EDITAR CATEGORIA:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al editar categoría",
    });
  }
};

// ======================
// ELIMINAR (SOFT DELETE)
// ======================
exports.eliminar = async (req, res) => {
  try {
    const { id_categoria } = req.params;

    const [result] = await db.query(
      "UPDATE categorias SET estado = 0 WHERE id_categoria = ?",
      [id_categoria]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Categoría no encontrada",
      });
    }

    return res.json({
      ok: true,
      message: "Categoría eliminada",
    });

  } catch (error) {
    console.error("ERROR ELIMINAR CATEGORIA:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al eliminar categoría",
    });
  }
};