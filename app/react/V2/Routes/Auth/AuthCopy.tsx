import React from 'react';
import { Translate } from '#app/I18N/index.js';

type CopyCode =
  | 'enter-both'
  | 'enter-username'
  | 'enter-password'
  | 'login-failed'
  | 'enter-code'
  | 'code-failed'
  | 'enter-email'
  | 'recovery-sent'
  | 'unreachable'
  | 'generic-error'
  | 'password-saved'
  | 'account-ready'
  | 'unlocked'
  | 'unlock-invalid'
  | 'passwords-mismatch'
  | 'enter-a-password';

type AuthTone = 'error' | 'note';

type AuthMessageValue = { tone: AuthTone; code: CopyCode } | null;

const AuthCopy = ({ code }: { code: CopyCode }) => {
  switch (code) {
    case 'enter-both':
      return <Translate>Enter your username and password.</Translate>;
    case 'enter-username':
      return <Translate>Enter your username.</Translate>;
    case 'enter-password':
      return <Translate>Enter your password.</Translate>;
    case 'login-failed':
      return <Translate>Login failed. Check your username and password.</Translate>;
    case 'enter-code':
      return <Translate>Enter the code from your authenticator app.</Translate>;
    case 'code-failed':
      return <Translate>Two-factor verification failed. Check the code and try again.</Translate>;
    case 'enter-email':
      return <Translate>Enter a valid email address.</Translate>;
    case 'recovery-sent':
      return (
        <Translate>
          If the email address supplied is correct, we will send instructions to reset the password.
        </Translate>
      );
    case 'unreachable':
      return <Translate>Could not reach server. Please try again later.</Translate>;
    case 'generic-error':
      return <Translate>An error occurred</Translate>;
    case 'password-saved':
      return <Translate>Your password is saved. Log in with it.</Translate>;
    case 'account-ready':
      return <Translate>Your account is ready. Log in with your new password.</Translate>;
    case 'unlocked':
      return <Translate>Account unlocked. You can log in.</Translate>;
    case 'unlock-invalid':
      return (
        <Translate>
          This unlock link is not valid. Ask an administrator to unlock the account.
        </Translate>
      );
    case 'passwords-mismatch':
      return <Translate>Passwords don&rsquo;t match.</Translate>;
    case 'enter-a-password':
      return <Translate>Enter a password.</Translate>;
    default:
      return null;
  }
};

const noticeMessage = (notice: string | null): AuthMessageValue => {
  switch (notice) {
    case 'password-saved':
      return { tone: 'note', code: 'password-saved' };
    case 'account-ready':
      return { tone: 'note', code: 'account-ready' };
    case 'unlocked':
      return { tone: 'note', code: 'unlocked' };
    case 'unlock-invalid':
      return { tone: 'error', code: 'unlock-invalid' };
    default:
      return null;
  }
};

export { AuthCopy, noticeMessage };
export type { AuthMessageValue, AuthTone, CopyCode };
