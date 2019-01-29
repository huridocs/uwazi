import mailer from 'api/utils/mailer';
import settings from 'api/settings/settings';

export default {
  async sendMessage({ email, name, text }) {
    const siteSettings = await settings.get();
    const mailOptions = {
      from: `"${name}" <${email}`,
      to: siteSettings.contactEmail,
      subject: 'Contact form',
      text,
    };

    return mailer.send(mailOptions);
  }
};
