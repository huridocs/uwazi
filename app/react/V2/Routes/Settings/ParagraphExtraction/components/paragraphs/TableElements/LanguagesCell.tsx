import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { Pill } from 'app/V2/Components/UI';
import { TablePXEntityParagraphRow } from 'app/V2/shared/ParagraphExtractionTypes';

const LanguagesCell = ({
  cell,
}: CellContext<TablePXEntityParagraphRow, TablePXEntityParagraphRow['sharedId']>) => (
  <div className="flex flex-wrap gap-2">
    {[cell.getValue()].map(value => (
      <div key={value} className="whitespace-nowrap uppercase text-xs font-medium">
        <Pill color="gray">{value}</Pill>
      </div>
    ))}
  </div>
);

export { LanguagesCell };
