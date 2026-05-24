const db = require("../config/db");
const PDFDocument = require('pdfkit');

const formatNumber = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '0';
  return new Intl.NumberFormat('es-EC', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numericValue);
};

const formatMoney = (value) => `$${formatNumber(value)}`;
const SQL_DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::\d{2})?$/;

const parseSqlLocalDateTime = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.match(SQL_DATE_TIME_PATTERN);
  if (!match) return null;
  return {
    year: match[1],
    month: match[2],
    day: match[3],
    hour: match[4],
    minute: match[5]
  };
};

const formatEcuadorDate = (value) =>
  parseSqlLocalDateTime(value)
    ? `${parseSqlLocalDateTime(value).day}/${parseSqlLocalDateTime(value).month}/${parseSqlLocalDateTime(value).year}`
    : new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(value));

const formatEcuadorTime = (value) =>
  parseSqlLocalDateTime(value)
    ? `${parseSqlLocalDateTime(value).hour}:${parseSqlLocalDateTime(value).minute}`
    : new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value));

exports.generarPDF = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const usuario_id = req.user.id_usuario;

    // 1. Validar que existan ventas en ese mes para ese negocio (Pagadas o Entregadas)
    const [ventas] = await db.query(
      `SELECT o.id, o.total, DATE_FORMAT(CONVERT_TZ(o.fecha_creacion, '+00:00', '-05:00'), '%Y-%m-%d %H:%i:%s') AS fecha_creacion, u.nombre AS cliente, o.metodo_pago
       FROM ordenes o
       JOIN negocios n ON n.id = o.negocio_id
       JOIN usuarios u ON u.id = o.usuario_id
       WHERE n.usuario_id = ? AND MONTH(CONVERT_TZ(o.fecha_creacion, '+00:00', '-05:00')) = ? AND YEAR(CONVERT_TZ(o.fecha_creacion, '+00:00', '-05:00')) = ?
       AND o.estado IN ('pagado', 'entregado')
       ORDER BY o.fecha_creacion ASC`,
      [usuario_id, mes, anio]
    );

    if (ventas.length === 0) {
      return res.status(404).json({ ok: false, message: "No hay ventas concretadas en este período." });
    }

    // 2. Obtener productos más vendidos del mes
    const [productosTop] = await db.query(
      `SELECT p.nombre_producto, SUM(IFNULL(d.cantidad, d.peso)) as total_vendido
       FROM detalle_orden d
       JOIN ordenes o ON d.orden_id = o.id
       JOIN productos p ON d.producto_id = p.id
       JOIN negocios n ON n.id = o.negocio_id
       WHERE n.usuario_id = ? AND MONTH(CONVERT_TZ(o.fecha_creacion, '+00:00', '-05:00')) = ? AND YEAR(CONVERT_TZ(o.fecha_creacion, '+00:00', '-05:00')) = ?
       AND o.estado IN ('pagado', 'entregado')
       GROUP BY p.id
       ORDER BY total_vendido DESC
       LIMIT 5`,
      [usuario_id, mes, anio]
    );

    // Cálculos para el reporte
    const totalIngresos = ventas.reduce((acc, v) => acc + Number(v.total), 0);
    const ingresosEfectivo = ventas.filter(v => v.metodo_pago === 'efectivo').reduce((acc, v) => acc + Number(v.total), 0);
    const ingresosTarjeta = ventas.filter(v => v.metodo_pago === 'tarjeta').reduce((acc, v) => acc + Number(v.total), 0);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Ventas_${mes}_${anio}.pdf`);
    doc.pipe(res);

    // === CABECERA ===
    doc.fontSize(20).font('Helvetica-Bold').text('Reporte de Ventas Mensual', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text(`Período: Mes ${mes} - Año ${anio}`, { align: 'center' });
    doc.moveDown(2);

    // === RESUMEN FINANCIERO ===
    doc.fontSize(14).font('Helvetica-Bold').text('Resumen Financiero', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Total de Órdenes Completadas: ${ventas.length}`);
    doc.text(`Ingresos en Efectivo: ${formatMoney(ingresosEfectivo)}`);
    doc.text(`Ingresos por Tarjeta (PayPhone): ${formatMoney(ingresosTarjeta)}`);
    doc.font('Helvetica-Bold').text(`Ingresos Totales: ${formatMoney(totalIngresos)}`);
    doc.moveDown(2);

    // === TOP PRODUCTOS ===
    doc.fontSize(14).font('Helvetica-Bold').text('Productos Más Vendidos', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    if (productosTop.length > 0) {
      productosTop.forEach((p, index) => {
        doc.text(`${index + 1}. ${p.nombre_producto} - ${Number(p.total_vendido)} unidades/peso`);
      });
    } else {
      doc.text('No hay datos suficientes de productos.');
    }
    doc.moveDown(2);

    // === LISTADO DE ÓRDENES (TABLA ALINEADA Y BONITA) ===
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#198754').text('Detalle de Órdenes', 50, doc.y, { underline: true });
    doc.fillColor('#000000'); // Resetear color a negro
    doc.moveDown(1);

    // Definimos las posiciones X fijas de cada columna para que jamás se descuadren
    const colIdX = 50;
    const colFechaX = 90;
    const colClienteX = 220;
    const colTotalX = 385;
    const colMetodoX = 470;

    let tableHeaderY = doc.y;

    // Pintamos las cabeceras de la tabla
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ID', colIdX, tableHeaderY, { width: 35 });
    doc.text('Fecha/Hora EC', colFechaX, tableHeaderY, { width: 120 });
    doc.text('Cliente', colClienteX, tableHeaderY, { width: 150 });
    doc.text('Total', colTotalX, tableHeaderY, { width: 75, align: 'right' });
    doc.text('Método', colMetodoX, tableHeaderY, { width: 80, align: 'right' });

    // Línea divisoria de la cabecera
    doc.moveTo(50, tableHeaderY + 15).lineTo(550, tableHeaderY + 15).lineWidth(1).strokeColor('#cccccc').stroke();
    
    // Punto de partida para los datos
    let currentY = tableHeaderY + 25;
    doc.font('Helvetica');

    ventas.forEach(v => {
      // 🛡️ Control de salto de página automático por si hay decenas de filas
      if (currentY > 730) {
        doc.addPage();
        currentY = 50; // Reiniciamos arriba en la nueva hoja
      }

      const fecha = `${formatEcuadorDate(v.fecha_creacion)} ${formatEcuadorTime(v.fecha_creacion)} EC`;

      // Forzamos a que todas las celdas de esta fila se pinten exactamente en el mismo "currentY"
      doc.text(`#${v.id}`, colIdX, currentY, { width: 35 });
      doc.text(fecha, colFechaX, currentY, { width: 120 });
      doc.text(v.cliente, colClienteX, currentY, { width: 150 });
      doc.text(formatMoney(v.total), colTotalX, currentY, { width: 75, align: 'right' });
      doc.text(v.metodo_pago.toUpperCase(), colMetodoX, currentY, { width: 80, align: 'right' });

      // Avanzamos 22 puntos limpiamente hacia la siguiente fila
      currentY += 22; 
    });

    doc.end();
  } catch (error) {
    console.error("ERROR GENERANDO PDF:", error);
    res.status(500).json({ ok: false, message: "Error al generar PDF" });
  }
};

// POST /api/reportes/guardar
exports.guardarReporte = async (req, res) => {
  try {
    const { mes, anio, total_ventas } = req.body;
    const usuario_id = req.user.id_usuario;

    const [negocioRows] = await db.query("SELECT id FROM negocios WHERE usuario_id = ?", [usuario_id]);
    if (negocioRows.length === 0) return res.status(404).json({ok: false, message: "Negocio no encontrado"});
    const negocio_id = negocioRows[0].id;

    // Verificar si ya está guardado
    const [exist] = await db.query("SELECT id FROM reportes_guardados WHERE negocio_id = ? AND mes = ? AND anio = ?", [negocio_id, mes, anio]);
    if (exist.length > 0) return res.status(400).json({ok: false, message: "El reporte de este mes ya está guardado."});

    await db.query(
      "INSERT INTO reportes_guardados (negocio_id, mes, anio, total_ventas) VALUES (?, ?, ?, ?)",
      [negocio_id, mes, anio, total_ventas]
    );

    res.json({ ok: true, message: "Reporte guardado exitosamente" });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error al guardar reporte" });
  }
};

// GET /api/reportes/listado
exports.listarReportesGuardados = async (req, res) => {
  try {
    const usuario_id = req.user.id_usuario;
    const [rows] = await db.query(
      `SELECT r.* FROM reportes_guardados r 
       JOIN negocios n ON n.id = r.negocio_id 
       WHERE n.usuario_id = ? ORDER BY r.anio DESC, r.mes DESC`,
      [usuario_id]
    );
    res.json({ ok: true, data: rows });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error al cargar reportes" });
  }
};

// DELETE /api/reportes/eliminar/:id
exports.eliminarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id_usuario;
    
    // Solo elimina si el reporte pertenece a un negocio de este usuario
    await db.query(
      `DELETE r FROM reportes_guardados r
       JOIN negocios n ON n.id = r.negocio_id
       WHERE r.id = ? AND n.usuario_id = ?`,
      [id, usuario_id]
    );
    res.json({ ok: true, message: "Reporte eliminado" });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error al eliminar reporte" });
  }
};
