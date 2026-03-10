import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { TablePXEntityRow } from 'V2/shared/ParagraphExtractionTypes';
import { PXEntityStatus } from '../PXEntityStatus';

const StatusCell = ({ cell }: CellContext<TablePXEntityRow, TablePXEntityRow['status']>) => (
  <div className="flex items-center gap-2">
    <PXEntityStatus status={cell.getValue().status} />
  </div>
);

export { StatusCell };
