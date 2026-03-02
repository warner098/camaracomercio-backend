const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificación de conexión al iniciar servidor
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Base de datos conectada correctamente");
    connection.release();
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error.message);
    process.exit(1); // 🔥 En producción es mejor detener el servidor si falla la BD
  }
};

testConnection();

module.exports = pool;