// ARCHIVO: controllers/pagos.controller.js

const db = require("../config/db");
const axios = require("axios"); // Asegúrate de ejecutar: npm install axios

// ==========================
// 1. GENERAR LINK PAYPHONE
// ==========================
exports.linkPayphone = async (req, res) => {
  try {
    const { id_orden, total, negocio_id } = req.body;

    // 1. Buscamos el ID de PayPhone del negocio específico
    const [rows] = await db.query("SELECT payphone_id FROM negocios WHERE id = ?", [negocio_id]);
    
    if (!rows[0] || !rows[0].payphone_id) {
        return res.status(400).json({ ok: false, message: "El negocio no tiene configurados sus pagos" });
    }

    const payphoneIdNegocio = rows[0].payphone_id;

    // 2. Generamos el cobro para ESE negocio
    const response = await axios.post(
      "https://pay.payphonetodoesposible.com/api/button/Prepare",
      {
        amount: Math.round(total * 100),
        amountWithoutTax: Math.round(total * 100),
        currency: "USD",
        clientTransactionId: id_orden.toString(),
        // AQUÍ ES DONDE SUCEDE LA MAGIA:
        storeId: payphoneIdNegocio, 
        responseUrl: `${process.env.FRONTEND_URL}/pago-exitoso`,
        cancellationUrl: `${process.env.FRONTEND_URL}/pago-cancelado`
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYPHONE_TOKEN}` }
      }
    );

    return res.json({ ok: true, url: response.data.paymentUrl });
  } catch (error) {
    // ... error handling
  }
};

// ==========================
// 2. GENERAR LINK KUSHKI
// ==========================
exports.linkKushki = async (req, res) => {
  try {
    const { id_orden, total } = req.body;

    // Llamada a la API de Kushki Smartlink
    const response = await axios.post(
      "https://api-stg.kushkipagos.com/smartlink/v1/links", // Usa la URL de producción cuando estés listo
      {
        amount: { subtotalIva0: total, subtotalIva: 0, iva: 0 },
        currency: "USD",
        description: `Orden #${id_orden}`,
        reference: id_orden.toString(),
        returnUrl: `${process.env.FRONTEND_URL}/pago-exitoso`
      },
      {
        headers: { "Private-Merchant-Id": process.env.KUSHKI_PRIVATE_KEY }
      }
    );

    return res.json({ ok: true, url: response.data.url });
  } catch (error) {
    console.error("Error Kushki:", error);
    return res.status(500).json({ ok: false, message: "Error generando link de Kushki" });
  }
};

// ==========================
// 3. WEBHOOKS (Actualizar DB)
// ==========================
exports.webhookConfirmacion = async (req, res) => {
  // Aquí Kushki o Payphone enviarán una petición POST cuando el usuario pague.
  // El formato exacto depende de la pasarela, pero la lógica de DB es esta:
  
  try {
    // Asumiendo que ambas te envían la referencia que mandaste (id_orden)
    const id_orden = req.body.clientTransactionId || req.body.reference; 

    if (!id_orden) return res.status(400).send("Falta ID");

    await db.query(
      `UPDATE ordenes SET estado = 'pagado', fecha_pago = NOW() WHERE id = ?`,
      [id_orden]
    );

    return res.status(200).send("OK");
  } catch (error) {
    return res.status(500).send("Error en webhook");
  }
};