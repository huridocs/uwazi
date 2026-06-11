import React, { useState } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { Button } from '#V2/Components/UI/Button.js';

type BertPasswordGateProps = {
  onUnlock: (password: string) => void;
};

const BertPasswordGate = ({ onUnlock }: BertPasswordGateProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim()) {
      setError('Enter your Uwazi password to continue.');
      return;
    }
    setError(null);
    onUnlock(password);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-vellum text-ink-secondary">
        <LockClosedIcon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">Confirm your password</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-ink-secondary">
        Bert needs your Uwazi password to access documents on your behalf. It is sent with each
        message and not stored after you close this window.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-sm">
        <label htmlFor="bert-password" className="sr-only">
          Password
        </label>
        <input
          id="bert-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="Uwazi password"
          className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-primary-400"
        />
        {error ? (
          <p role="alert" className="mt-2 text-sm text-error-700">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="medium" className="mt-4 w-full">
          Continue
        </Button>
      </form>
    </div>
  );
};

export { BertPasswordGate };
