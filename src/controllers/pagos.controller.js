const db = require("../config/db");
const axios = require("axios"); 

exports.linkPayphone = async (req, res) => {
  try {
    const { id_orden, total, negocio_id } = req.body;

    const [rows] = await db.query("SELECT payphone_id FROM negocios WHERE id = ?", [negocio_id]);
    
    if (!rows[0] || !rows[0].payphone_id) {
        return res.status(400).json({ ok: false, message: "El negocio no tiene configurado su Store ID de PayPhone" });
    }

    // Definimos la base de la URL del frontend (Netlify en producción o localhost en desarrollo)
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const response = await axios.post(
      "https://pay.payphonetodoesposible.com/api/button/Prepare",
      {
        amount: Math.round(total * 100),
        amountWithoutTax: Math.round(total * 100),
        currency: "USD",
        clientTransactionId: id_orden.toString(),
        storeId: rows[0].payphone_id, 
        // URLs corregidas con parámetros de estado para el componente de React
        responseUrl: `${baseUrl}/pago-finalizado?status=Aprobado&metodo=tarjeta&orden=${id_orden}`,
        cancellationUrl: `${baseUrl}/pago-finalizado?status=Cancelado`
      },
      {
        headers: { 
          Authorization: `Bearer ${process.env.PAYPHONE_TOKEN}` 
        }
      }
    );

    // PayPhone devuelve la URL en response.data.payWithCard
    return res.json({ ok: true, url: response.data.payWithCard });
  } catch (error) {
    const detalleError = error.response?.data?.message || error.message;
    console.error("Error en Payphone:", detalleError);
    return res.status(500).json({ ok: false, message: `PayPhone dice: ${detalleError}` });
  }
};

exports.webhookConfirmacion = async (req, res) => {
  try {
    const id_orden = req.body.clientTransactionId || req.body.reference;
    const transactionId = req.body.transactionId; // PayPhone envía esto

    if (!id_orden || !transactionId) return res.status(400).send("Faltan datos");

    // Validar con la API de PayPhone que el pago es real y está "Approved"
    const response = await axios.get(
      `https://pay.payphonetodoesposible.com/api/api/v2.0/Transactions/${transactionId}`,
      { headers: { Authorization: `Bearer ${process.env.PAYPHONE_TOKEN}` } }
    );

    if (response.data.transactionStatus !== 'Approved') {
      return res.status(400).send("Transacción no aprobada");
    }

    await db.query(
      `UPDATE ordenes SET estado = 'pagado', fecha_pago = NOW() WHERE id = ?`,
      [id_orden]
    );

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Error en webhook:", error);
    return res.status(500).send("Error en webhook");
  }
};