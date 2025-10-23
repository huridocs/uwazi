import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { TablePXEntityParagraphRow } from 'V2/shared/ParagraphExtractionTypes';
import { Truncate } from 'app/V2/Components/UI';

const TextCell = ({
  cell,
}: CellContext<TablePXEntityParagraphRow, TablePXEntityParagraphRow['paragraphText']>) => {
  const text = cell.getValue();

  return (
    <Truncate
      maxLength={200}
      ellipsisPosition="center"
      tooltipClassname="text-xs text-gray-900 inline-block max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl min-w-32 whitespace-normal"
    >
      {text}
    </Truncate>
  );
};

export { TextCell };
