import React from 'react';
import { Translate } from '#app/I18N/index.js';

interface PaginationStateProps {
  page: number;
  size: number;
  total: number;
  currentLength: number;
}

const PaginationState = ({ page = 1, size, currentLength, total }: PaginationStateProps) => {
  const from = (page - 1) * size + 1;
  return (
    <div className="text-sm font-semibold text-center text-ink">
      <span className="font-light text-ink-muted">
        <Translate>Showing</Translate>
      </span>
      &nbsp;
      {from}-{from + currentLength - 1}
      &nbsp;
      <span className="font-light text-ink-muted">
        <Translate>of</Translate>
      </span>
      &nbsp;
      {total}
    </div>
  );
};

export { PaginationState };
