const { sendMail, transporterPromise } = require('./src/config/mail');

(async () => {
  try {
    // Ensure transporter is ready
    await transporterPromise;
    const info = await sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com',
      to: process.env.TEST_TO || 'ton.email@exemple.com',
      subject: 'Test SMTP',
      text: "Test d'envoi SMTP"
    });
    console.log('Test email sent:', info.messageId || info.response || info);
  } catch (err) {
    console.error('Test email failed:', err && err.message ? err.message : err);
  }
})();