const nodemailer = require("nodemailer");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const enviarVerificacion = async (email, link) => {

  try {

    console.log("Intentando enviar correo a:", email);
    console.log("Link:", link);

    const info = await transporter.sendMail({
      from: `"Cámara de Comercio - Jipijapa" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verifica tu cuenta",
      html: `
        <h2>Verificación de cuenta</h2>
        <p>Haz click para activar tu cuenta:</p>
        <a href="${link}">Activar cuenta</a>
      `
    });

    console.log("Correo enviado:", info.messageId);

  } catch (error) {

    console.error("ERROR MAIL:", error);

  }

};

module.exports = enviarVerificacion;