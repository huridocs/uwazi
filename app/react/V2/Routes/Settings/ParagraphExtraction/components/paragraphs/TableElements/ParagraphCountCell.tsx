import { CellContext } from '@tanstack/react-table';

import { TablePXEntityParagraphRow } from '#V2/shared/ParagraphExtractionTypes.js';
import React from 'react';

const ParagraphCountCell = ({
  cell,
}: CellContext<TablePXEntityParagraphRow, TablePXEntityParagraphRow['paragraphNumber']>) => (
  <span className="text-xs font-medium text-gray-900 text-center flex items-center">
    {cell.getValue()}
  </span>
);

export { ParagraphCountCell };
