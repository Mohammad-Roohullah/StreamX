import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html }) => {
  // Ethereal: nodemailer generates a throwaway test SMTP account automatically.
  // Swap this block for real credentials (Gmail/SendGrid) at deploy time.
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
        user: testAccount.user,
        pass: testAccount.pass,
        },
    });

    const info = await transporter.sendMail({
        from: '"SteamX" <no-reply@SteamX.dev>',
        to,
        subject,
        html,
    });

    // Production: use your own SMTP account
    // const transporter = nodemailer.createTransport({
    //     host: process.env.EMAIL_HOST,
    //     port: Number(process.env.EMAIL_PORT),
    //     secure: process.env.EMAIL_SECURE === "true",
    //     auth: {
    //         user: process.env.EMAIL_USER,
    //         pass: process.env.EMAIL_PASSWORD,
    //     },
    // });

    // const sendEmail = async ({ to, subject, html }) => {
    //     const info = await transporter.sendMail({
    //         from: `"StreamX" <${process.env.EMAIL_FROM}>`,
    //         to,
    //         subject,
    //         html,
    // });

    console.log("Email Sent:", info.messageId, " Preview email URL:", nodemailer.getTestMessageUrl(info));
    // ^ open this URL in your browser to "read" the email during development
    return info;
};

export { sendEmail };