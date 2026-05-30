const crypto = require("crypto");
const db = require("../config/db");

const ORDER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ORDER_CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const ORDER_CODE_LENGTH = 8;
let orderCodeSchemaPromise = null;

const generarCodigoOrdenCandidato = () => {
  let codigo = "";

  for (let i = 0; i < ORDER_CODE_LENGTH; i += 1) {
    const index = crypto.randomInt(0, ORDER_CODE_ALPHABET.length);
    codigo += ORDER_CODE_ALPHABET[index];
  }

  if (!/[A-Z]/.test(codigo)) {
    const position = crypto.randomInt(0, ORDER_CODE_LENGTH);
    const index = crypto.randomInt(0, ORDER_CODE_LETTERS.length);
    codigo = `${codigo.slice(0, position)}${ORDER_CODE_LETTERS[index]}${codigo.slice(position + 1)}`;
  }

  return codigo;
};

const generarCodigoOrdenUnico = async (connection) => {
  for (let intento = 0; intento < 12; intento += 1) {
    const codigo = generarCodigoOrdenCandidato();
    const [rows] = await connection.query(
      "SELECT id FROM ordenes WHERE codigo_orden = ? LIMIT 1",
      [codigo]
    );

    if (rows.length === 0) return codigo;
  }

  throw new Error("No se pudo generar un codigo unico para la orden");
};

const asegurarCodigoOrdenSchema = async () => {
  if (!orderCodeSchemaPromise) {
    orderCodeSchemaPromise = (async () => {
      const connection = await db.getConnection();

      try {
        const [columns] = await connection.query(
          `SELECT COLUMN_NAME
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'ordenes'
             AND COLUMN_NAME = 'codigo_orden'`
        );

        if (columns.length === 0) {
          try {
            await connection.query(
              "ALTER TABLE ordenes ADD COLUMN codigo_orden VARCHAR(12) NULL AFTER id"
            );
          } catch (error) {
            if (error.code !== "ER_DUP_FIELDNAME" && error.errno !== 1060) {
              throw error;
            }
          }
        }

        const [ordenesSinCodigo] = await connection.query(
          "SELECT id FROM ordenes WHERE codigo_orden IS NULL OR codigo_orden = ''"
        );

        for (const orden of ordenesSinCodigo) {
          const codigo = await generarCodigoOrdenUnico(connection);
          await connection.query(
            "UPDATE ordenes SET codigo_orden = ? WHERE id = ?",
            [codigo, orden.id]
          );
        }

        const [indexes] = await connection.query(
          `SELECT INDEX_NAME
           FROM INFORMATION_SCHEMA.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'ordenes'
             AND INDEX_NAME = 'idx_ordenes_codigo_orden'`
        );

        if (indexes.length === 0) {
          try {
            await connection.query(
              "ALTER TABLE ordenes ADD UNIQUE INDEX idx_ordenes_codigo_orden (codigo_orden)"
            );
          } catch (error) {
            if (error.code !== "ER_DUP_KEYNAME" && error.errno !== 1061) {
              throw error;
            }
          }
        }
      } finally {
        connection.release();
      }
    })().catch((error) => {
      orderCodeSchemaPromise = null;
      throw error;
    });
  }

  return orderCodeSchemaPromise;
};

const normalizarIdentificadorOrden = (identificador) => {
  const codigo = String(identificador || "").trim().toUpperCase();
  return {
    codigo,
    idNumerico: /^\d+$/.test(codigo) ? Number(codigo) : -1
  };
};

const codigoPublicoOrden = (orden = {}) => orden.codigo_orden || String(orden.id);

module.exports = {
  asegurarCodigoOrdenSchema,
  generarCodigoOrdenUnico,
  normalizarIdentificadorOrden,
  codigoPublicoOrden
};
