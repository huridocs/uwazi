import React from 'react';
import { Translate } from '#app/I18N/index.js';

const TabLabel = ({
  text,
  icon,
  count,
}: {
  text: string;
  icon: React.ReactElement;
  count?: number;
}) => (
  <span className="inline-flex max-w-full items-center justify-center gap-1 md:justify-start">
    <Translate className="sr-only md:not-sr-only">{text}</Translate>
    <span className="inline-flex shrink-0 md:hidden" aria-hidden="true">
      {icon}
    </span>
    {count !== undefined && (
      <span className="text-xs font-semibold text-ink-tertiary px-1 rounded shrink-0 bg-warm">
        {count}
      </span>
    )}
  </span>
);

export { TabLabel };
