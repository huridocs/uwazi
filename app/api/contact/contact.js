import mailer from '#api/utils/mailer.js';
import settings from '#api/settings/settings.js';

export default {
  async sendMessage({ email, name, message }) {
    const siteSettings = await settings.get();
    const emailSender = mailer.createSenderDetails(siteSettings);
    const mailOptions = {
      from: emailSender,
      to: siteSettings.contactEmail,
      subject: `Contact mesage from ${name} ${email}`,
      text: message,
    };

    return mailer.send(mailOptions);
  },
};
