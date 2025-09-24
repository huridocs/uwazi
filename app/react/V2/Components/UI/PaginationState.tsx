import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';

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
