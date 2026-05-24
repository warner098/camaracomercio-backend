const cron = require("node-cron");
const db = require("../config/db");

const iniciarTareasProgramadas = () => {
  // Se ejecuta el día 1 de cada mes a la 01:00 AM ("0 1 1 * *")
  cron.schedule("0 1 1 * *", async () => {
    console.log("⏳ [CRON] Iniciando cálculo de reportes mensuales...");
    
    try {
      // 1. Calcular cuál fue el mes anterior
      const partesFechaEcuador = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Guayaquil",
        month: "numeric",
        year: "numeric"
      }).formatToParts(new Date());
      const mesActualEcuador = Number(partesFechaEcuador.find((part) => part.type === "month")?.value || 1);
      const anioActualEcuador = Number(partesFechaEcuador.find((part) => part.type === "year")?.value || new Date().getFullYear());
      const mesPasado = mesActualEcuador === 1 ? 12 : mesActualEcuador - 1;
      const anioPasado = mesActualEcuador === 1 ? anioActualEcuador - 1 : anioActualEcuador;

      // 2. Sumar todas las ventas 'pagadas' agrupadas por negocio
      const [ventas] = await db.query(
        `SELECT negocio_id, COUNT(id) as pedidos, SUM(total) as total_recaudado
         FROM ordenes 
         WHERE estado = 'pagado' 
         AND MONTH(CONVERT_TZ(fecha_creacion, '+00:00', '-05:00')) = ? 
         AND YEAR(CONVERT_TZ(fecha_creacion, '+00:00', '-05:00')) = ?
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
  }, {
    timezone: "America/Guayaquil"
  });
};

module.exports = iniciarTareasProgramadas;
