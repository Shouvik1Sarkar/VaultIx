import nodemailer from "nodemailer";
import {
  MAILTRAP_HOST,
  MAILTRAP_PASSWORD,
  MAILTRAP_PORT,
  MAILTRAP_USERNAME,
} from "../../config/env.config.js";

const data = {
  host: MAILTRAP_HOST,
  port: MAILTRAP_PORT,
  secure: false,
  //   pool: true, // Enable connection pooling
  //   maxConnections: 5, // Maximum number of simultaneous connections (default: 5)
  //   maxMessages: 100, // Messages per connection before reconnecting (default: 100)
  auth: {
    user: MAILTRAP_USERNAME,
    pass: MAILTRAP_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(data);
async function mail(email, subject, text) {
  await transporter.sendMail({
    from: "noreply@example.com",
    to: email,
    subject: subject,
    text: text,
  });
}
export { mail };
