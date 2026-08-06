import { EmailMessage } from '#api/core/application/contracts/EmailSender.js';

type AccountLockedEmailParams = {
  to: string;
  username: string;
  domain: string;
  unlockCode: string;
};

function accountLockedEmail(params: AccountLockedEmailParams): EmailMessage {
  const link = `${params.domain}/unlockaccount/${params.username}/${params.unlockCode}`;
  return {
    to: params.to,
    subject: 'Account locked',
    text:
      'Hello,\n\n' +
      'Your account has been locked because of too many failed login attempts. ' +
      `To unlock your account open the following link:\n${link}`,
  };
}

export { accountLockedEmail };
export type { AccountLockedEmailParams };
