import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { TablePXEntityParagraphRow } from 'V2/shared/ParagraphExtractionTypes';
import { Truncate } from 'app/V2/Components/UI';

const TextCell = ({
  cell,
}: CellContext<TablePXEntityParagraphRow, TablePXEntityParagraphRow['paragraphText']>) => {
  const text = cell.getValue();

  return (
    <Truncate maxLength={200} ellipsisPosition="center" tooltipClassname="text-xs text-gray-900">
      {text}
    </Truncate>
  );
};

export { TextCell };
