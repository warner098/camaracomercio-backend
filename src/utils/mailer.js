const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const enviarVerificacion = async (email, link) => {
  try {

    console.log("Enviando correo con Resend a:", email);

    await resend.emails.send({
  from: "Cámara de Comercio <eeeeeq40@gmail.com>",
  to: email,
  subject: "Verifica tu cuenta",
  html: `
    <h2>Verificación de cuenta</h2>
    <p>Haz click para activar tu cuenta:</p>
    <a href="${link}">Activar cuenta</a>
  `
});

    console.log("Correo enviado correctamente");

  } catch (error) {

    console.error("Error enviando correo:", error);

  }
};

module.exports = enviarVerificacion;