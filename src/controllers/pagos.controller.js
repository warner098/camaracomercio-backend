const db = require("../config/db");
const axios = require("axios"); 

exports.linkPayphone = async (req, res) => {
  try {
    const { id_orden, total, negocio_id } = req.body;

    const [rows] = await db.query("SELECT payphone_id FROM negocios WHERE id = ?", [negocio_id]);
    
    if (!rows[0] || !rows[0].payphone_id) {
        return res.status(400).json({ ok: false, message: "El negocio no tiene configurado su Store ID de PayPhone" });
    }

<<<<<<< HEAD
=======
    // Definimos la base de la URL del frontend (asegúrate que en tu .env sea http://localhost:5173)
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";

>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
    const response = await axios.post(
      "https://pay.payphonetodoesposible.com/api/button/Prepare",
      {
        amount: Math.round(total * 100),
        amountWithoutTax: Math.round(total * 100),
        currency: "USD",
        clientTransactionId: id_orden.toString(),
        storeId: rows[0].payphone_id, 
<<<<<<< HEAD
        responseUrl: `${process.env.FRONTEND_URL}/#/pago-finalizado`,
        cancellationUrl: `${process.env.FRONTEND_URL}/#/pago-finalizado`
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYPHONE_TOKEN}` }
      }
    );

=======
        // 🔥 URLs corregidas con parámetros de estado
        responseUrl: `${baseUrl}/pago-finalizado?status=Aprobado`,
        cancellationUrl: `${baseUrl}/pago-finalizado?status=Cancelado`
      },
      {
        headers: { 
          // Asegúrate de que este TOKEN sea el de tu cuenta de desarrollador de PayPhone
          Authorization: `Bearer ${process.env.PAYPHONE_TOKEN}` 
        }
      }
    );

    // PayPhone devuelve la URL en response.data.payWithCard
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
    return res.json({ ok: true, url: response.data.payWithCard });
  } catch (error) {
    const detalleError = error.response?.data?.message || error.message;
    console.error("Error en Payphone:", detalleError);
    return res.status(500).json({ ok: false, message: `PayPhone dice: ${detalleError}` });
  }
};

exports.webhookConfirmacion = async (req, res) => {
  try {
<<<<<<< HEAD
    const id_orden = req.body.clientTransactionId || req.body.reference; 
=======
    const id_orden = req.body.clientTransactionId || req.body.reference;
    console.log("Webhook recibido para orden:", id_orden);
>>>>>>> 522ded4 (🚀 Backend: Despliegue inicial para Render)
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