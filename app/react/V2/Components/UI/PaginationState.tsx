import React from 'react';
import { Translate } from 'app/I18N';

interface PaginationStateProps {
  page: number;
  size: number;
  total: number;
  currentLength: number;
}

const PaginationState = ({ page = 1, size, currentLength, total }: PaginationStateProps) => {
  const from = (page - 1) * size + 1;
  return (
    <div className="text-sm font-semibold text-center text-gray-900">
      <span className="font-light text-gray-500">
        <Translate>Showing</Translate>
      </span>
      &nbsp;
      {from}-{from + currentLength - 1}
      &nbsp;
      <span className="font-light text-gray-500">
        <Translate>of</Translate>
      </span>
      &nbsp;
      {total}
    </div>
  );
};

export { PaginationState };
