import React from 'react';
import { CellContext } from '@tanstack/react-table';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Pill } from '../../V2/Components/UI.js';
import { TablePXEntityRow } from '../../../../../../shared/ParagraphExtractionTypes.js';

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
