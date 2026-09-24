import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { useIsMobile } from '#app/V2/CustomHooks/useIsMobile.js';
import { AccentDot } from '#V2/Components/UI/AccentDot.js';

const TabLabel = ({ text, count, dirty }: { text: string; count?: number; dirty?: boolean }) => {
  const isMobile = useIsMobile();
  return (
    <span className="inline-flex max-w-full items-center gap-1">
      <Translate>{text}</Translate>
      {dirty ? <AccentDot /> : null}
      {!isMobile && count !== undefined && (
        <span className="text-xs font-semibold text-ink-tertiary px-1 rounded shrink-0 bg-warm">
          {count}
        </span>
      )}
    </span>
  );
};

export { TabLabel };
