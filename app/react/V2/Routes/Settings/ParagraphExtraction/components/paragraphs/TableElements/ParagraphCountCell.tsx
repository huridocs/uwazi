import { CellContext } from '@tanstack/react-table';
import React from 'react';
import { PXParagraphTable } from '../../../types';

const ParagraphCountCell = ({
  cell,
}: CellContext<PXParagraphTable, PXParagraphTable['paragraphCount']>) => (
  <span className="text-xs font-medium text-gray-900 text-center flex items-center">
    {cell.getValue()}
  </span>
);

export { ParagraphCountCell };
