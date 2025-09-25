import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { TablePXEntityRow } from '#shared/ParagraphExtractionTypes.js';

const DisplayCell = ({ cell }: CellContext<TablePXEntityRow, string | number>) => (
  <span className="text-xs font-medium text-gray-900">{cell.getValue()}</span>
);

export { DisplayCell };
