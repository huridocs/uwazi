import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { AccentDot } from '#V2/Components/UI/AccentDot.js';

const TabLabel = ({
  text,
  icon,
  count,
  dirty,
}: {
  text: string;
  icon?: React.ReactElement;
  count?: number;
  dirty?: boolean;
}) => (
  <span className="inline-flex max-w-full items-center justify-center gap-1 md:justify-start">
    <Translate className="sr-only md:not-sr-only">{text}</Translate>
    {icon ? (
      <span className="inline-flex shrink-0 md:hidden" aria-hidden="true">
        {icon}
      </span>
    ) : null}
    {dirty ? <AccentDot /> : null}
    {count !== undefined && (
      <span className="text-xs font-semibold text-ink-tertiary px-1 rounded shrink-0 bg-warm">
        {count}
      </span>
    )}
  </span>
);

export { TabLabel };
