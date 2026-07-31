const db = require("../config/db");

const columnChecks = new Map();

const asegurarColumna = async (tableName, columnName, columnDefinition) => {
  const key = `${tableName}.${columnName}`;

  if (!columnChecks.has(key)) {
    columnChecks.set(
      key,
      (async () => {
        const connection = await db.getConnection();

        try {
          const [columns] = await connection.query(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?`,
            [tableName, columnName]
          );

          if (columns.length > 0) return;

          try {
            await connection.query(
              `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`
            );
          } catch (error) {
            if (error.code !== "ER_DUP_FIELDNAME" && error.errno !== 1060) {
              throw error;
            }
          }
        } finally {
          connection.release();
        }
      })().catch((error) => {
        columnChecks.delete(key);
        throw error;
      })
    );
  }

  return columnChecks.get(key);
};

const asegurarCamposNegocioServicios = async () => {
  await asegurarColumna("negocios", "tipo_negocio", "ENUM('productos', 'servicios', 'mixto') NOT NULL DEFAULT 'productos'");
  await asegurarColumna("negocios", "latitud", "DECIMAL(10,8) NULL");
  await asegurarColumna("negocios", "longitud", "DECIMAL(11,8) NULL");
};

const asegurarCamposProductoServicios = async () => {
  await asegurarColumna("productos", "tipo_oferta", "ENUM('producto', 'servicio') NOT NULL DEFAULT 'producto'");
  await asegurarColumna("productos", "modalidad_cobro", "ENUM('unidad', 'medida', 'por_hora', 'contrato', 'fijo') NOT NULL DEFAULT 'unidad'");
};

const asegurarCamposPedidoUbicacion = async () => {
  await asegurarColumna("ordenes", "latitud_destino", "DECIMAL(10,8) NULL");
  await asegurarColumna("ordenes", "longitud_destino", "DECIMAL(11,8) NULL");
};

module.exports = {
  asegurarColumna,
  asegurarCamposNegocioServicios,
  asegurarCamposProductoServicios,
  asegurarCamposPedidoUbicacion
};
