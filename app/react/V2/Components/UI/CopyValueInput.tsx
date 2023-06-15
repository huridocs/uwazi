import React, { useEffect, useState } from 'react';
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';

interface CopyValueInputProps {
  value: string;
  className?: string;
  label: string | JSX.Element;
  hideLabel?: boolean;
  id?: string;
}

const CopyValueInput = ({ value, className, label, id, hideLabel }: CopyValueInputProps) => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [copied]);

  return (
    <div className={`${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : ''}>
        {label}
      </label>
      <div className="relative w-full">
        <input
          type="text"
          disabled
          value={value}
          id={id}
          className="disabled:text-gray-500 rounded-lg bg-gray-50 block flex-1 w-full text-sm p-2.5"
        />
        <div className="absolute right-0 flex items-center top-px">
          <button
            type="button"
            onClick={copyToClipboard}
            data-testid="copy-value-button"
            className="hover:text-primary-700 text-gray-900 p-2.5 text-sm font-medium rounded-r-lg
             focus:outline-none"
          >
            {copied ? (
              <CheckIcon className="w-5 text-success-600" />
            ) : (
              <ClipboardDocumentIcon className="w-5" />
            )}

            <Translate className="sr-only">Copy to clipboard</Translate>
          </button>
          {copied && (
            <div
              role="tooltip"
              className="absolute right-0 z-10 inline-block px-3 py-2 text-sm font-medium bg-white rounded-lg shadow-sm -top-11 border-gray-50 w-max"
            >
              <Translate>Copied to clipboard</Translate>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { CopyValueInput };
