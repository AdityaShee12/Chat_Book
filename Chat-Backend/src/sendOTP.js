import nodemailer from "nodemailer";
// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // আপনার ইমেইল
    pass: process.env.EMAIL_PASS, // App Password
  },
});
export { transporter };
