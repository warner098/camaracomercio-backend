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

module.exports = {
  asegurarColumna
};
