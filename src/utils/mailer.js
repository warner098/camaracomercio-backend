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

    sendSmtpEmail.subject = "Verifica tu cuenta - Plataforma CCJ";
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="background-color: #1b5e20; padding: 25px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Cámara de Comercio Jipijapa</h2>
          </div>
          <div style="padding: 40px 30px; text-align: center; color: #333333;">
            <h3 style="margin-top: 0; color: #212529; font-size: 20px;">¡Bienvenido a nuestra plataforma!</h3>
            <p style="font-size: 16px; line-height: 1.5; color: #6c757d;">Para comenzar a realizar pedidos o gestionar tu negocio, necesitamos confirmar tu dirección de correo electrónico.</p>
            <a href="${link}" style="display: inline-block; background-color: #198754; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 50px; font-weight: bold; font-size: 16px; margin-top: 25px;">Verificar mi cuenta</a>
            <p style="margin-top: 40px; font-size: 13px; color: #adb5bd;">Si tú no solicitaste este registro, puedes ignorar este correo de forma segura.</p>
          </div>
        </div>
      </div>
    `;
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

    sendSmtpEmail.subject = "Recuperación de Contraseña - Plataforma CCJ";
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="background-color: #212529; padding: 25px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Restablecer Contraseña</h2>
          </div>
          <div style="padding: 40px 30px; text-align: center; color: #333333;">
            <h3 style="margin-top: 0; color: #212529; font-size: 20px;">¿Olvidaste tu contraseña?</h3>
            <p style="font-size: 16px; line-height: 1.5; color: #6c757d;">No te preocupes, haz clic en el botón de abajo para configurar una nueva. Este enlace es válido por <strong>1 hora</strong>.</p>
            <a href="${link}" style="display: inline-block; background-color: #ffc107; color: #212529; text-decoration: none; padding: 14px 30px; border-radius: 50px; font-weight: bold; font-size: 16px; margin-top: 25px;">Crear nueva contraseña</a>
            <p style="margin-top: 40px; font-size: 13px; color: #adb5bd;">Si no solicitaste un cambio de contraseña, ignora este mensaje y tu cuenta seguirá segura.</p>
          </div>
        </div>
      </div>
    `;
    sendSmtpEmail.sender = { name: "Cámara de Comercio Jipijapa", email: "8al1es@gmail.com" };
    sendSmtpEmail.to = [{ email: email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Correo de recuperación enviado.");
  } catch (error) {
    console.error("Error enviando correo de recuperación:", error);
  }
};

module.exports = { enviarVerificacion, enviarRecuperacion };