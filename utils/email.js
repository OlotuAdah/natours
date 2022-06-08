const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //1:create a transporter (service that will send the email)
  const transporter = nodemailer.createTransport({
    host: process.env.EmailHost,
    port: process.env.EmailPort,
    auth: {
      user: process.env.EmailUsername,
      pass: process.env.EmailPassword,
    },
  });

  //2:define emal options
  const mailOptions = {
    from: "Olotu Adah <adaholotu@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html
  };

  //3:sned email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
