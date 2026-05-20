const cron = require("node-cron");
const db = require("../config/db");

const iniciarTareasProgramadas = () => {
  // Se ejecuta el día 1 de cada mes a la 01:00 AM ("0 1 1 * *")
  cron.schedule("0 1 1 * *", async () => {
    console.log("⏳ [CRON] Iniciando cálculo de reportes mensuales...");
    
    try {
      // 1. Calcular cuál fue el mes anterior
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - 1);
      const mesPasado = fecha.getMonth() + 1; // getMonth() es 0-11
      const anioPasado = fecha.getFullYear();

      // 2. Sumar todas las ventas 'pagadas' agrupadas por negocio
      const [ventas] = await db.query(
        `SELECT negocio_id, COUNT(id) as pedidos, SUM(total) as total_recaudado
         FROM ordenes 
         WHERE estado = 'pagado' 
         AND MONTH(fecha_creacion) = ? 
         AND YEAR(fecha_creacion) = ?
         GROUP BY negocio_id`,
        [mesPasado, anioPasado]
      );

      // 3. Insertar los resultados en reportes_mensuales
      for (const v of ventas) {
        await db.query(
          `INSERT INTO reportes_mensuales (negocio_id, mes, anio, total_ventas, pedidos_completados) 
           VALUES (?, ?, ?, ?, ?)`,
          [v.negocio_id, mesPasado, anioPasado, v.total_recaudado, v.pedidos]
        );
      }

      console.log(`✅ [CRON] Reportes del mes ${mesPasado}/${anioPasado} generados con éxito.`);
    } catch (error) {
      console.error("❌ [CRON] Error generando reportes:", error);
    }
  });
};

module.exports = iniciarTareasProgramadas;