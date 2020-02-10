import mailer from 'api/utils/mailer';
import settings from 'api/settings/settings';

export default {
  async sendMessage({ email, name, message }) {
    const siteSettings = await settings.get();
    const mailOptions = {
      from: '"Uwazi" <no-reply@uwazi.io',
      to: siteSettings.contactEmail,
      subject: `Contact mesage from ${name} ${email}`,
      text: message,
    };

    return mailer.send(mailOptions);
  },
};
