import { CellContext } from '@tanstack/react-table';
import { TablePXEntityParagraphRow } from 'app/V2/shared/ParagraphExtractionTypes';
import React from 'react';

const ParagraphCountCell = ({
  cell,
}: CellContext<TablePXEntityParagraphRow, TablePXEntityParagraphRow['sharedId']>) => (
  <span className="text-xs font-medium text-gray-900 text-center flex items-center">
    {cell.getValue()}
  </span>
);

export { ParagraphCountCell };
