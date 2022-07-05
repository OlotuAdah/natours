const nodemailer = require('nodemailer');
const ejs = require('ejs');
const htmlToText = require('html-to-text');
module.exports = class Email {
  constructor(user, url) {
    //1:define emal options
    // console.log(user, url);
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.from = `Olotu Adah <${process.env.EMAIL_FROM}>`;
    this.url = url;
  }
  //2:create a transporter (service that will send the email)
  modifiedCreateTransport() {
    if (process.env.NODE_ENV === 'prod') {
      //use a robust transporter in production (SendGrid)
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    //use this simple tranporter (Mail Trap) in dev
    return nodemailer.createTransport({
      host: process.env.EmailHost,
      port: process.env.EmailPort,
      auth: {
        user: process.env.EmailUsername,
        pass: process.env.EmailPassword,
      },
    });
  }
  //3:sned actual email

  async send(view, subject) {
    // 1: create HTML from the pug template supplied
    let html = ``;
    ejs.renderFile(
      `${__dirname}/../views/email/${view}.ejs`,
      {
        firstName: this.firstName,
        url: this.url,
        subject: subject,
      },
      (err, str) => {
        if (err) {
          return new AppError(err.message, 500);
        } else {
          html = str;
        }
      }
    );

    //2: define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html, { wordwrap: 130 }),
      //NB: text fied contains text version of the mail (no html)
    };
    //3: create a transporter and send email
    await this.modifiedCreateTransport().sendMail(mailOptions);
    //   await transporter.sendMail(mailOptions);
  }
  async sendWelcomeMail() {
    //welcomMail.ejs is the name of the view to be sent as email; second arg is mail subject
    await this.send('welcomeMail', 'Welcome to the natours family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordResetMail',
      'Your password reset token (Valid for only 10 min)'
    );
  }
};

// const laugh = "😂"
