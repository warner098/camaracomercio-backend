const db = require("../config/db");
const axios = require("axios"); 

exports.linkPayphone = async (req, res) => {
  try {
    const { id_orden, total, negocio_id } = req.body;

    const [rows] = await db.query("SELECT payphone_id FROM negocios WHERE id = ?", [negocio_id]);
    
    if (!rows[0] || !rows[0].payphone_id) {
        return res.status(400).json({ ok: false, message: "El negocio no tiene configurado su Store ID de PayPhone" });
    }

    const response = await axios.post(
      "https://pay.payphonetodoesposible.com/api/button/Prepare",
      {
        amount: Math.round(total * 100),
        amountWithoutTax: Math.round(total * 100),
        currency: "USD",
        clientTransactionId: id_orden.toString(),
        storeId: rows[0].payphone_id, 
        responseUrl: `${process.env.FRONTEND_URL}/#/pago-finalizado`,
        cancellationUrl: `${process.env.FRONTEND_URL}/#/pago-finalizado`
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYPHONE_TOKEN}` }
      }
    );

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