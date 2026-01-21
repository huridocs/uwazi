import React from 'react';
import { CellContext } from '@tanstack/react-table';

import { Pill } from '#V2/Components/UI/index.js';

import { TablePXEntityRow } from '#V2/shared/ParagraphExtractionTypes.js';

const LanguagesCell = ({
  cell,
}: CellContext<TablePXEntityRow, TablePXEntityRow['availableFileLanguages']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue().map(value => (
      <div key={value} className="whitespace-nowrap uppercase text-xs font-medium">
        <Pill color="gray">{value}</Pill>
      </div>
    ))}
  </div>
);

export { LanguagesCell };
