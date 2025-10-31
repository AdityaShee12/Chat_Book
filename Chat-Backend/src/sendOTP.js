import nodemailer from "nodemailer";
// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sheeaditya12@gmail.com",
    pass: "ujmy eglt gjzf tjzj",
  },
});
console.log("Works");

export { transporter };
