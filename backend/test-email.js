const { transporter } = require('./src/config/mail');

(async () => {
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: 'ton.email@exemple.com',
      subject: 'Test SMTP',
      text: 'Test d\'envoi SMTP'
    });
    console.log('Test email sent:', info.messageId);
  } catch (err) {
    console.error('Test email failed:', err && err.message ? err.message : err);
  }
})();