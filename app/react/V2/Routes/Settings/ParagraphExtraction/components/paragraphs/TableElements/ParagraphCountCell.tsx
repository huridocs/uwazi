import { CellContext } from '@tanstack/react-table';
// @ts-expect-error TS(2307): Cannot find module '../../shared/V2/shared/Paragra... Remove this comment to see the full error message
import { TablePXEntityParagraphRow } from 'shared/V2/shared/ParagraphExtractionTypes.js';
import React from 'react';

const ParagraphCountCell = ({
  cell,
}: CellContext<TablePXEntityParagraphRow, TablePXEntityParagraphRow['paragraphNumber']>) => (
  <span className="text-xs font-medium text-gray-900 text-center flex items-center">
    {cell.getValue()}
  </span>
);

export { ParagraphCountCell };
