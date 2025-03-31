import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { PXEntityStatus } from '../PXEntityStatus';
import { PXEntityTable } from '../../../types';

const StatusCell = ({ cell }: CellContext<PXEntityTable, PXEntityTable['status']>) => (
  <div className="flex items-center gap-2">
    <PXEntityStatus status={cell.getValue()} />
  </div>
);

export { StatusCell };
