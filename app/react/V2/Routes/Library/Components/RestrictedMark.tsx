import React from 'react';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';

type RestrictedMarkProps = {
  published?: boolean;
};

const RestrictedMark = ({ published }: RestrictedMarkProps) => {
  if (published !== false) return null;

  return (
    <span
      title={t('System', 'Restricted: only people it is shared with can see it', null, false)}
      className="inline-flex shrink-0"
    >
      <LockClosedIcon className="h-[11px] w-[11px] text-ink-tertiary" aria-hidden />
      <Translate className="sr-only">
        Restricted: only people it is shared with can see it
      </Translate>
    </span>
  );
};

export type { RestrictedMarkProps };
export { RestrictedMark };
