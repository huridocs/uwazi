import React from 'react';
import { Translate } from '#app/I18N/index.js';

type ShowAllToggleProps = {
  expanded: boolean;
  total: number;
  onToggle: () => void;
};

const ShowAllToggle = ({ expanded, total, onToggle }: ShowAllToggleProps) => (
  <button
    type="button"
    aria-expanded={expanded}
    className="self-start text-xs font-medium text-ink-secondary underline underline-offset-2 hover:text-ink"
    onClick={onToggle}
  >
    {expanded ? (
      <Translate>Show less</Translate>
    ) : (
      <>
        <Translate>Show all</Translate>
        {` ${total}`}
      </>
    )}
  </button>
);

export { ShowAllToggle };
export type { ShowAllToggleProps };
