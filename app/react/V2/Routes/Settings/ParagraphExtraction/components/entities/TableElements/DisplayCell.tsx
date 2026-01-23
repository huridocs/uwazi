import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { TablePXEntityRow } from '#V2/shared/ParagraphExtractionTypes.js';

const DisplayCell = ({ cell }: CellContext<TablePXEntityRow, string | number | undefined>) => (
  <span className="text-xs font-medium text-gray-900">{cell.getValue()}</span>
);

export { DisplayCell };
