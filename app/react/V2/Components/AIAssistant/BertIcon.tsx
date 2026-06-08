import React from 'react';

const BERT_SEAL_COLOR = '#FF3D00';
const BERT_CARBON_COLOR = '#18AEDD';

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
    <span
      className="rounded-[2px]"
      style={{ width: squareSize, height: squareSize, backgroundColor: BERT_SEAL_COLOR }}
    />
    <span
      className="rounded-[2px]"
      style={{ width: squareSize, height: squareSize, backgroundColor: BERT_CARBON_COLOR }}
    />
  </span>
);

/** Stacked seal/carbon mark (2×2 px squares by default). */
const BertIcon = ({ className = '' }: { className?: string }) => (
  <BertIconStacked squareSize={2} gap={1} className={className} />
);

export { BertIcon, BertIconStacked, BERT_CARBON_COLOR, BERT_SEAL_COLOR };
export type { BertIconStackedProps };
