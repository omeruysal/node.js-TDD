const nodemailer = require('nodemailer');
const nodemailerStub = require('nodemailer-stub');

let transporter;
if (process.env.NODE_ENV === 'test') {
  transporter = nodemailer.createTransport(nodemailerStub.stubTransport);
} else {
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'jeffry.cremin23@ethereal.email',
      pass: 'FvxJXCPM6R4du1G9CF',
    },
  });
}

module.exports = transporter;
