import React, { ReactNode, useId, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { INPUT, LABEL } from './authStyles.js';

const AuthPasswordField = ({
  label,
  value,
  onChange,
  invalid,
  describedBy,
  autoComplete,
  disabled,
  inputRef,
  name,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
  autoComplete: 'current-password' | 'new-password';
  disabled?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  name?: string;
}) => {
  const id = useId();
  const [show, setShow] = useState(false);
  const revealLabel = show
    ? t('System', 'Hide password', null, false)
    : t('System', 'Show password', null, false);

  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={event => onChange(event.target.value)}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? describedBy : undefined}
          className={`${INPUT} pe-10`}
        />
        <button
          type="button"
          onClick={() => setShow(current => !current)}
          aria-label={revealLabel}
          aria-controls={id}
          className="absolute end-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-tertiary hover:bg-warm hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30"
        >
          {show ? (
            <EyeSlashIcon className="h-4 w-4" aria-hidden />
          ) : (
            <EyeIcon className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
};

export { AuthPasswordField };
