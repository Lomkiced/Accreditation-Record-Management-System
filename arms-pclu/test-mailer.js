require("dotenv").config();
const nodemailer = require("nodemailer");

async function testMailer() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"ARMS Support" <${process.env.GMAIL_USER}>`,
    to: "janellamaeducusin@gmail.com",
    subject: "Test Email",
    text: "This is a test email.",
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

testMailer();
