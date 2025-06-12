import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { TablePXEntityParagraphRow } from 'V2/shared/ParagraphExtractionTypes';
import { TruncatedText } from 'app/V2/Components/UI';

const TextCell = ({
  cell,
}: CellContext<TablePXEntityParagraphRow, TablePXEntityParagraphRow['paragraphText']>) => {
  const text = cell.getValue();

  return (
    <TruncatedText maxLength={120} tooltipClassname="text-xs text-gray-900">
      <span className="relative max-w-full text-xs font-normal text-gray-900">{text}</span>
    </TruncatedText>
  );
};

export { TextCell };
