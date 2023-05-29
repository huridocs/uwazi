import React, { useState } from 'react';
import ClipboardDocumentIcon from '@heroicons/react/24/outline/ClipboardDocumentIcon';
import { Translate } from 'app/I18N';

interface CopyValueInputProps {
  value: string;
  className?: string;
}

const CopyValueInput = ({ value, className }: CopyValueInputProps) => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className={`relative w-full mb-4 ${className}`}>
      <input
        type="text"
        disabled
        value={value}
        className="disabled:text-gray-500 rounded-lg bg-gray-50 block flex-1 w-full text-sm p-2.5"
      />
      <div className="top-px absolute right-0 items-center flex">
        <button
          type="button"
          onClick={copyToClipboard}
          data-testid="copy-value-button"
          className="hover:text-primary-700 text-gray-900 p-2.5 text-sm font-medium rounded-r-lg
             focus:outline-none"
        >
          <ClipboardDocumentIcon className="w-5" />
          <Translate className="sr-only">Copy to clipboard</Translate>
        </button>
        {copied && (
          <div
            role="tooltip"
            className="absolute -top-11 border-gray-50 w-max right-0 z-10 inline-block px-3 py-2 text-sm font-medium rounded-lg shadow-sm bg-white"
          >
            <Translate>Copied to clipboard</Translate>
          </div>
        )}
      </div>
    </div>
  );
};

export { CopyValueInput };
