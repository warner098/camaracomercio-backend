const SibApiV3Sdk = require("sib-api-v3-sdk");

const enviarVerificacion = async (email, link) => {
  try {

    console.log("Enviando correo con Brevo a:", email);

    const client = SibApiV3Sdk.ApiClient.instance;

    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = "Verifica tu cuenta";
    sendSmtpEmail.htmlContent = `
      <h2>Verificación de cuenta</h2>
      <p>Haz click para activar tu cuenta:</p>
      <a href="${link}">Activar cuenta</a>
    `;

    sendSmtpEmail.sender = {
      name: "Cámara de Comercio Jipijapa",
      email: "tuemail@gmail.com"
    };

    sendSmtpEmail.to = [
      {
        email: email
      }
    ];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("Correo enviado correctamente con Brevo");

  } catch (error) {

    console.error("Error enviando correo:", error);

  }
};

module.exports = enviarVerificacion;