import React from 'react';
import { InboxIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
    <InboxIcon className="h-7 w-7 text-ink-muted" strokeWidth={1.5} />
    <p className="text-[13px] font-medium text-ink-secondary">
      <Translate>You&apos;re all caught up</Translate>
    </p>
    <p className="text-[11px] text-ink-muted">
      <Translate>New activity will show up here.</Translate>
    </p>
  </div>
);

export { EmptyState };
