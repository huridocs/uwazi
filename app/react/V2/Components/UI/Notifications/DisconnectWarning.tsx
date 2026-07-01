import React from 'react';
import { LinkSlashIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';

const DisconnectWarning = ({ tooltipId }: { tooltipId: string }) => (
  <span className="relative inline-flex group">
    <button
      type="button"
      className="inline-flex items-center rounded-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-indigo-300"
      aria-label="Server disconnected"
      aria-describedby={tooltipId}
    >
      <LinkSlashIcon className="h-4 w-4 cursor-help" aria-hidden="true" />
    </button>
    <span
      id={tooltipId}
      role="tooltip"
      className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 rounded-md border border-border bg-paper px-2.5 py-1.5 text-xs text-ink-secondary whitespace-nowrap opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
    >
      <Translate>Cannot connect to server</Translate>
    </span>
  </span>
);

export { DisconnectWarning };
