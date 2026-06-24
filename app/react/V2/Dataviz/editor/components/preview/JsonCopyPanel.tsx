import React, { useEffect, useState } from 'react';
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

type JsonCopyPanelProps = {
  title?: string;
  value: unknown;
  emptyMessage?: string;
};

const JsonCopyPanel = ({ title, value, emptyMessage = 'No data loaded' }: JsonCopyPanelProps) => {
  const [copied, setCopied] = useState(false);
  const text =
    value === null || value === undefined ? emptyMessage : JSON.stringify(value, null, 2);

  const copyToClipboard = async () => {
    if (value === null || value === undefined) {
      return;
    }
    await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopied(true);
  };

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        {title ? <h4 className="text-sm font-medium text-ink">{title}</h4> : <span />}
        <button
          type="button"
          onClick={copyToClipboard}
          disabled={value === null || value === undefined}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-ink-secondary hover:bg-vellum hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 text-success-600" />
              Copied
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-auto rounded-lg bg-vellum p-4 text-xs text-ink">{text}</pre>
    </div>
  );
};

export { JsonCopyPanel };
