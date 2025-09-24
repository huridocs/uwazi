import React from 'react';
import { CellContext } from '@tanstack/react-table';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Pill } from '../../V2/Components/UI.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/V2/shared/Paragra... Remove this comment to see the full error message
import { TablePXEntityParagraphRow } from 'shared/V2/shared/ParagraphExtractionTypes.js';

const LanguagesCell = ({
  cell,
}: CellContext<TablePXEntityParagraphRow, TablePXEntityParagraphRow['language']>) => (
  <div className="flex flex-wrap gap-2">
    {[cell.getValue()].map(value => (
      <div key={value} className="whitespace-nowrap uppercase text-xs font-medium">
        <Pill color="gray">{value}</Pill>
      </div>
    ))}
  </div>
);

export { LanguagesCell };
