import React from 'react';

type BertIconStackedProps = {
  /** Edge length of each square in pixels. */
  squareSize?: number;
  /** Gap between squares in pixels. */
  gap?: number;
  className?: string;
};

const BertIconStacked = ({ squareSize = 6, gap = 2, className = '' }: BertIconStackedProps) => (
  <span
    className={`inline-flex shrink-0 flex-col ${className}`.trim()}
    style={{ gap }}
    aria-hidden="true"
  >
    <span className="rounded-[2px] bg-[#FF3D00]" style={{ width: squareSize, height: squareSize }} />
    <span className="rounded-[2px] bg-[#18AEDD]" style={{ width: squareSize, height: squareSize }} />
  </span>
);

/** Stacked seal/carbon mark (2×2 px squares by default). */
const BertIcon = ({ className = '' }: { className?: string }) => (
  <BertIconStacked squareSize={2} gap={1} className={className} />
);

export { BertIcon, BertIconStacked };
export type { BertIconStackedProps };
