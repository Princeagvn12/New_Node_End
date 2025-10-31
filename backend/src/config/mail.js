require('dotenv').config();
const nodemailer = require('nodemailer');

async function createTransporter() {
  // Use explicit SMTP config if provided
  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    try {
      await transporter.verify();
      console.log('SMTP transporter ready (configured SMTP host)');
      return transporter;
    } catch (err) {
      console.error('Configured SMTP verification failed:', err && err.message ? err.message : err);
      // fallthrough to createTestAccount
    }
  }

  // Fallback: create ethereal test account for dev
  console.warn('Falling back to Ethereal test account (development only)');
  const testAccount = await nodemailer.createTestAccount();
  const ethTransporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  await ethTransporter.verify();
  console.log('Ethereal transporter ready. Preview URL will be logged after sending.');
  return ethTransporter;
}

let transporterPromise = createTransporter();

async function sendMail({ to, subject, html, text }) {
  const transporter = await transporterPromise;
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com',
      to,
      subject,
      text,
      html
    });
    console.log('Mail sent:', info.messageId);
    // If Ethereal test account used, log preview URL
    if (nodemailer.getTestMessageUrl) {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log('Preview URL:', preview);
    }
    return info;
  } catch (err) {
    console.error('sendMail error:', err && err.message ? err.message : err);
    throw err;
  }
}

module.exports = { sendMail, transporter: transporterPromise };