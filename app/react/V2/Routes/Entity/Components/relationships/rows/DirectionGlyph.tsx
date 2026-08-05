import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';

type Direction = 'incoming' | 'outgoing' | 'both';

type DirectionGlyphProps = {
  direction: Direction;
};

const directionTitles: Record<Direction, string> = {
  both: 'Bidirectional',
  incoming: 'Incoming',
  outgoing: 'Outgoing',
};

const DirectionGlyph = ({ direction }: DirectionGlyphProps) => {
  const config = {
    both: { Icon: ArrowsRightLeftIcon, box: 'h-3 w-4' },
    incoming: { Icon: ArrowLeftIcon, box: 'h-3 w-3' },
    outgoing: { Icon: ArrowRightIcon, box: 'h-3 w-3' },
  }[direction];
  const { Icon, box } = config;
  const title = t('System', directionTitles[direction], null, false);

  return (
    <span
      aria-label={title}
      title={title}
      className={`inline-flex shrink-0 items-center justify-center rounded-[2px] bg-vellum text-ink-tertiary ${box}`}
    >
      <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
    </span>
  );
};

export type { Direction };
export { DirectionGlyph };
