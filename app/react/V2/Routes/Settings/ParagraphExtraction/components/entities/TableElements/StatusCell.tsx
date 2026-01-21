import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { TablePXEntityRow } from '#V2/shared/ParagraphExtractionTypes.js';
import { PXEntityStatus } from '#V2/Routes/Settings/ParagraphExtraction/components/entities/PXEntityStatus.jsx';

const StatusCell = ({ cell }: CellContext<TablePXEntityRow, TablePXEntityRow['status']>) => (
  <div className="flex items-center gap-2">
    <PXEntityStatus status={cell.getValue().status} />
  </div>
);

export { StatusCell };
