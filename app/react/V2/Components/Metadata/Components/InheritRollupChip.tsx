import React from 'react';

const InheritRollupChip = ({ text, title }: { text: string; title: string }) => (
  <span
    title={title}
    className="inline-flex w-fit items-center gap-1 rounded-md bg-carbon-tint px-1.5 py-0.5 text-meta font-medium text-carbon"
  >
    <span aria-hidden>Σ</span>
    {text}
  </span>
);

export { InheritRollupChip };
