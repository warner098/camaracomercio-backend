const SibApiV3Sdk = require("sib-api-v3-sdk");

const getApiInstance = () => {
  const client = SibApiV3Sdk.ApiClient.instance;
  const apiKey = client.authentications["api-key"];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  return new SibApiV3Sdk.TransactionalEmailsApi();
};

const enviarVerificacion = async (email, link) => {
  try {
    const apiInstance = getApiInstance();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = "Verifica tu cuenta";
    sendSmtpEmail.htmlContent = `<h2>Verificación de cuenta</h2><p>Haz click para activar tu cuenta:</p><a href="${link}">Activar cuenta</a>`;
    sendSmtpEmail.sender = { name: "Cámara de Comercio Jipijapa", email: "8al1es@gmail.com" };
    sendSmtpEmail.to = [{ email: email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Correo de verificación enviado.");
  } catch (error) {
    console.error("Error enviando correo de verificación:", error);
  }
};

const enviarRecuperacion = async (email, link) => {
  try {
    const apiInstance = getApiInstance();
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = "Recuperación de Contraseña";
    sendSmtpEmail.htmlContent = `<h2>Restablecer Contraseña</h2><p>Has solicitado restablecer tu contraseña. Haz click en el enlace de abajo (válido por 1 hora):</p><a href="${link}">Restablecer Contraseña</a>`;
    sendSmtpEmail.sender = { name: "Cámara de Comercio Jipijapa", email: "8al1es@gmail.com" };
    sendSmtpEmail.to = [{ email: email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Correo de recuperación enviado.");
  } catch (error) {
    console.error("Error enviando correo de recuperación:", error);
  }
};

module.exports = { enviarVerificacion, enviarRecuperacion };