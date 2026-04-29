const PDFDocument = require("pdfkit");
const db = require("../config/db");

const descargarReportePDF = async (req, res) => {
  try {
    const { mes, anio } = req.query; 
    const usuario_id = req.user.id_usuario;

    // 1. Obtener el ID del negocio del dueño actual
    const [negocioRows] = await db.query(
      "SELECT id, nombre_negocio FROM negocios WHERE usuario_id = ?", 
      [usuario_id]
    );

    if (negocioRows.length === 0) {
      return res.status(404).json({ ok: false, message: "No tienes un negocio registrado." });
    }
    const negocio = negocioRows[0];

    // 2. Obtener órdenes con JOIN a la tabla usuarios para sacar el nombre del cliente
    const [ordenes] = await db.query(
      `SELECT o.id, o.total, o.fecha_creacion, u.nombre AS cliente_nombre 
       FROM ordenes o
       JOIN usuarios u ON u.id = o.usuario_id
       WHERE o.negocio_id = ? 
       AND o.estado = 'pagado'
       AND MONTH(o.fecha_creacion) = ? 
       AND YEAR(o.fecha_creacion) = ?`,
      [negocio.id, mes, anio]
    );

    // 3. Configurar el documento PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=Reporte_${mes}_${anio}.pdf`);
    doc.pipe(res);

    // --- DISEÑO DEL REPORTE ---
    doc.fontSize(22).fillColor("#1b5e20").text("Reporte Mensual de Ventas", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor("#333").text(negocio.nombre_negocio, { align: "center" });
    doc.fontSize(12).fillColor("#666").text(`Período: Mes ${mes} del año ${anio}`, { align: "center" });
    doc.moveDown(2);

    let totalRecaudado = 0;

    if (ordenes.length === 0) {
      doc.fontSize(14).fillColor("#999").text("No se registraron ventas pagadas en este período.", { align: "center" });
    } else {
      // Cabecera de la tabla en el PDF
      doc.fontSize(12).fillColor("#000").text("ID", 50, doc.y, { continued: true });
      doc.text("Cliente", 120, doc.y, { continued: true });
      doc.text("Fecha", 350, doc.y, { continued: true });
      doc.text("Monto", 450, doc.y);
      doc.moveTo(50, doc.y + 2).lineTo(530, doc.y + 2).stroke();
      doc.moveDown(1);

      // Listar órdenes
      ordenes.forEach(o => {
        const fecha = new Date(o.fecha_creacion).toLocaleDateString();
        doc.fontSize(10).fillColor("#333");
        doc.text(`#${o.id}`, 50, doc.y, { continued: true });
        doc.text(`${o.cliente_nombre || 'S/N'}`, 120, doc.y, { continued: true });
        doc.text(`${fecha}`, 350, doc.y, { continued: true });
        doc.text(`$${Number(o.total).toFixed(2)}`, 450, doc.y);
        doc.moveDown(0.5);
        totalRecaudado += Number(o.total);
      });

      doc.moveDown(2);
      doc.moveTo(400, doc.y).lineTo(530, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor("#1b5e20").text(`TOTAL: $${totalRecaudado.toFixed(2)}`, { align: "right" });
    }

    doc.end();

  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, message: "Error interno al generar el PDF." });
    }
  }
};

const listarReportes = async (req, res) => {
  try {
    const usuario_id = req.user.id_usuario;
    
    // Primero sacamos el ID del negocio
    const [negocioRows] = await db.query("SELECT id FROM negocios WHERE usuario_id = ?", [usuario_id]);
    if (negocioRows.length === 0) return res.json({ ok: true, data: [] });

    // Luego buscamos sus reportes guardados
    const [reportes] = await db.query(
      "SELECT * FROM reportes_mensuales WHERE negocio_id = ? ORDER BY anio DESC, mes DESC",
      [negocioRows[0].id]
    );

    res.json({ ok: true, data: reportes });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error al obtener reportes" });
  }
};

// Exórtala junto con la del PDF:
module.exports = {
  descargarReportePDF,
  listarReportes // 🔥 NUEVA
};
