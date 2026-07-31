/**
 * SCRIPT PARA CAMBIAR EL CORREO DEL ADMINISTRADOR
 * Uso: node cambiar_correo_admin.js nuevo_correo@ejemplo.com
 * O simplemente ejecuta: node cambiar_correo_admin.js
 */

require('dotenv').config();

const pool = require("./src/config/db");

const nuevoCorreoParam = process.argv[2];
const nuevoCorreoFinal = nuevoCorreoParam || "camarajipijapa@gmail.com";

async function cambiarCorreoAdmin() {
  try {
    const [result] = await pool.query(
      `UPDATE usuarios SET correo = ? WHERE rol = 'admin'`,
      [nuevoCorreoFinal]
    );

    if (result.affectedRows > 0) {
      console.log(`\n=======================================================`);
      console.log(`✅ ¡CORREO DE ADMINISTRADOR ACTUALIZADO CON ÉXITO!`);
      console.log(`📧 Nuevo Correo Admin: ${nuevoCorreoFinal}`);
      console.log(`=======================================================\n`);
    } else {
      console.log("❌ No se encontró ningún usuario con rol 'admin'.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al actualizar correo del admin:", error.message);
    process.exit(1);
  }
}

cambiarCorreoAdmin();
