import { EmailMessage } from '#api/core/application/contracts/EmailSender.js';

type PasswordRecoveryEmailParams = {
  to: string;
  username: string;
  domain: string;
  key: string;
};

function passwordRecoveryEmail(params: PasswordRecoveryEmailParams): EmailMessage {
  const link = `${params.domain}/setpassword/${params.key}`;
  return {
    to: params.to,
    subject: 'Password recovery',
    text:
      `Your username is: ${params.username}\n` +
      `To set your password click on the following link:\n${link}\n` +
      'This link will be valid for 24 hours.',
  };
}

export { passwordRecoveryEmail };
export type { PasswordRecoveryEmailParams };
