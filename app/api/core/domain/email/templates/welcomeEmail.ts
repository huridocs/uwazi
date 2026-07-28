import { EmailMessage } from '#api/core/application/contracts/EmailSender.js';

type WelcomeEmailParams = {
  to: string;
  username: string;
  domain: string;
  key: string;
  siteName?: string;
};

function welcomeEmail(params: WelcomeEmailParams): EmailMessage {
  const siteName = params.siteName || 'Uwazi';
  const link = `${params.domain}/setpassword/${params.key}?createAccount=true`;
  const text =
    'Hello!\n\n' +
    `The administrators of ${siteName} have created an account for you under the user name:\n` +
    `${params.username}\n\n` +
    'To complete this process, please create a strong password by clicking on the following link:\n' +
    `${link}\n` +
    'This link will be valid for 24 hours.\n\n' +
    'For more information about the Uwazi platform, visit https://www.uwazi.io.\n\nThank you!\nUwazi team';

  const htmlLink = `<a href="${link}">${link}</a>`;
  const html =
    '<p>Hello!</p>' +
    `<p>The administrators of ${siteName} have created an account for you under the user name: <b>${params.username}</b></p>` +
    `<p>To complete this process, please create a strong password by clicking on the following link:<br />${htmlLink}</p>` +
    '<p>This link will be valid for 24 hours.</p>' +
    '<p>For more information about the Uwazi platform, visit <a href="https://www.uwazi.io">https://www.uwazi.io</a>.</p>' +
    '<p>Thank you!<br />Uwazi team</p>';

  return {
    to: params.to,
    subject: `Welcome to ${siteName}`,
    text,
    html,
  };
}

export { welcomeEmail };
export type { WelcomeEmailParams };
