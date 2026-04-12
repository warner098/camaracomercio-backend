// src/controllers/unidades.controller.js
const db = require("../config/db");

// ======================
// LISTAR UNIDADES (TODAS)
// ======================
exports.listar = async (req, res) => {
  try {
    // 🔥 Quitamos el filtro de estado para que el admin vea todo
    const [rows] = await db.query("SELECT id_unidad, nombre, estado FROM unidades_medida");
    return res.json({ ok: true, data: rows });
  } catch (error) {
    console.error("ERROR LISTAR UNIDADES:", error);
    return res.status(500).json({ ok: false, message: "Error al listar unidades" });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, message: "Nombre requerido" });

    await db.query("INSERT INTO unidades_medida (nombre, estado) VALUES (?, 1)", [nombre]);
    return res.status(201).json({ ok: true, message: "Unidad creada" });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error al crear unidad" });
  }
};

exports.editar = async (req, res) => {
  try {
    const { id_unidad } = req.params;
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ ok: false, message: "Nombre requerido" });

    const [result] = await db.query("UPDATE unidades_medida SET nombre = ? WHERE id_unidad = ?", [nombre, id_unidad]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Unidad no encontrada" });

    return res.json({ ok: true, message: "Unidad actualizada" });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error al editar unidad" });
  }
};

// 🔥 NUEVA FUNCIÓN PARA ACTIVAR
exports.activar = async (req, res) => {
  try {
    const { id_unidad } = req.params;
    const [result] = await db.query("UPDATE unidades_medida SET estado = 1 WHERE id_unidad = ?", [id_unidad]);
    
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Unidad no encontrada" });
    return res.json({ ok: true, message: "Unidad activada correctamente" });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error al activar unidad" });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id_unidad } = req.params;
    const [result] = await db.query("UPDATE unidades_medida SET estado = 0 WHERE id_unidad = ?", [id_unidad]);
    
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Unidad no encontrada" });
    return res.json({ ok: true, message: "Unidad desactivada" });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error al eliminar unidad" });
  }
};