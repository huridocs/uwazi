import React from 'react';
import { AuthCopy, type AuthMessageValue } from './AuthCopy.js';

const messageRole = (message: AuthMessageValue): 'alert' | 'status' | undefined => {
  if (!message) return undefined;
  if (message.tone === 'error') return 'alert';
  return 'status';
};

const AuthMessage = ({ id, message }: { id: string; message: AuthMessageValue }) => (
  <div id={id} data-part="message" role={messageRole(message)} className="mt-4 min-h-5 text-sm">
    {message ? (
      <span className={message.tone === 'error' ? 'text-error-600' : 'text-ink-secondary'}>
        <AuthCopy code={message.code} />
      </span>
    ) : null}
  </div>
);

export { AuthMessage };
