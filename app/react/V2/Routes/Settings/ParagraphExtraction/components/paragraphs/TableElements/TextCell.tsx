import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { TablePXEntityParagraphRow } from '../../../../../../shared/ParagraphExtractionTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Truncate } from '../../V2/Components/UI.js';

const TextCell = ({
  cell,
}: CellContext<TablePXEntityParagraphRow, TablePXEntityParagraphRow['paragraphText']>) => {
  const text = cell.getValue();

  return (
    <Truncate
      maxLength={200}
      ellipsisPosition="center"
      tooltipClassname="text-xs text-gray-900 inline-block md:min-w-[500px] max-w-5xl"
    >
      {text}
    </Truncate>
  );
};

export { TextCell };
