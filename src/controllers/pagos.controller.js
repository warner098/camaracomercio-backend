// ARCHIVO: controllers/pagos.controller.js

const db = require("../config/db");
const axios = require("axios"); 

// ==========================
// 1. GENERAR LINK PAYPHONE
// ==========================

exports.linkPayphone = async (req, res) => {
  try {
    const { id_orden, total, negocio_id } = req.body;

    // 1. Buscamos el Store ID del negocio
    const [rows] = await db.query("SELECT payphone_id FROM negocios WHERE id = ?", [negocio_id]);
    
    if (!rows[0] || !rows[0].payphone_id) {
        return res.status(400).json({ ok: false, message: "El negocio no tiene configurado su Store ID de PayPhone" });
    }

    const payphoneIdNegocio = rows[0].payphone_id;

    // 2. Generamos el cobro
    const response = await axios.post(
      "https://pay.payphonetodoesposible.com/api/button/Prepare",
      {
        amount: Math.round(total * 100),
        amountWithoutTax: Math.round(total * 100),
        currency: "USD",
        clientTransactionId: id_orden.toString(),
        storeId: payphoneIdNegocio, 
        responseUrl: `${process.env.FRONTEND_URL}/#/pago-finalizado`,
        cancellationUrl: `${process.env.FRONTEND_URL}/#/pago-finalizado`
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYPHONE_TOKEN}` }
      }
    );

    // 🔥 EL CAMBIO ESTÁ AQUÍ 🔥
    // Usamos payWithCard en lugar de paymentUrl
    return res.json({ ok: true, url: response.data.payWithCard });

  } catch (error) {
    const detalleError = error.response?.data?.message || error.message;
    console.error("Error en Payphone:", detalleError);
    return res.status(500).json({ ok: false, message: `PayPhone dice: ${detalleError}` });
  }
};

// ==========================
// 2. GENERAR LINK KUSHKI
// ==========================
exports.linkKushki = async (req, res) => {
  try {
    const { id_orden, total, negocio_id } = req.body;

    const [rows] = await db.query("SELECT kushki_merchant_id FROM negocios WHERE id = ?", [negocio_id]);
    if (!rows[0] || !rows[0].kushki_merchant_id) {
        return res.status(400).json({ ok: false, message: "El negocio no configuró Kushki" });
    }

    const response = await axios.post(
      "https://api-stg.kushkipagos.com/smartlink/v1/links", 
      {
        amount: { subtotalIva0: parseFloat(total), subtotalIva: 0, iva: 0 },
        currency: "USD",
        description: `Orden #${id_orden}`,
        reference: id_orden.toString(),
        returnUrl: `${process.env.FRONTEND_URL}/#/pago-finalizado`
      },
      { headers: { "Private-Merchant-Id": rows[0].kushki_merchant_id } }
    );

    return res.json({ ok: true, url: response.data.url });
  } catch (error) {
    console.error("Error Kushki:", error.response?.data || error.message);
    return res.status(500).json({ ok: false, message: "Error en Kushki" });
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