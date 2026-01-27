import { createColumnHelper } from '@tanstack/react-table';

import { TablePXEntityParagraphRow } from '#V2/shared/ParagraphExtractionTypes.js';
import { generateTableHeader } from '#V2/Routes/Settings/ParagraphExtraction/utils/generateTableHeader.js';
import { LanguagesCell } from '#V2/Routes/Settings/ParagraphExtraction/components/paragraphs/TableElements/LanguagesCell.js';
import { ParagraphCountCell } from '#V2/Routes/Settings/ParagraphExtraction/components/paragraphs/TableElements/ParagraphCountCell.js';
import { ActionCell } from '#V2/Routes/Settings/ParagraphExtraction/components/paragraphs/TableElements/ActionCell.js';
import { TextCell } from '#V2/Routes/Settings/ParagraphExtraction/components/paragraphs/TableElements/TextCell.js';

const pxColumnHelper = createColumnHelper<TablePXEntityParagraphRow>();

const tableBuilder = ({ onViewAction }: { onViewAction: (paragraphId: string) => void }) => [
  pxColumnHelper.accessor('paragraphNumber', {
    header: generateTableHeader('Paragraph #', { className: 'whitespace-nowrap' }),
    cell: ParagraphCountCell,
    enableSorting: false,
    meta: { headerClassName: 'w-0' },
  }),
  pxColumnHelper.accessor('language', {
    header: generateTableHeader('Language'),
    cell: LanguagesCell,
    enableSorting: false,
    meta: { headerClassName: 'w-0' },
  }),
  pxColumnHelper.accessor('paragraphText', {
    header: generateTableHeader('Text'),
    cell: TextCell,
    enableSorting: false,
    meta: { headerClassName: 'w-full' },
  }),
  pxColumnHelper.accessor('rowId', {
    header: generateTableHeader('Action', { className: 'sr-only' }),
    cell: props =>
      ActionCell(() => {
        const paragraphId = props.cell.getValue();
        if (paragraphId) {
          onViewAction(paragraphId);
        }
      }),
    enableSorting: false,
    meta: { headerClassName: 'w-0' },
  }),
];

export { tableBuilder };
