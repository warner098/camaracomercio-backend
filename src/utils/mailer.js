const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const enviarVerificacion = async (email, link) => {

  await transporter.sendMail({
    from: "Cámara de Comercio - Jipijapa",
    to: email,
    subject: "Verifica tu cuenta",
    html: `
      <h2>Verificación de cuenta</h2>
      <p>Haz click para activar tu cuenta:</p>
      <a href="${link}">Activar cuenta</a>
    `
  });

};

module.exports = enviarVerificacion;