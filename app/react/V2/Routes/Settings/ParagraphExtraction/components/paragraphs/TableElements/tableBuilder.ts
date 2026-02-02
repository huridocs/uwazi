import { createColumnHelper } from '@tanstack/react-table';

import { TablePXEntityParagraphRow } from '#V2/shared/ParagraphExtractionTypes.js';
import { generateTableHeader } from '../../../utils/generateTableHeader.js';
import { LanguagesCell } from './LanguagesCell.js';
import { ParagraphCountCell } from './ParagraphCountCell.js';
import { ActionCell } from './ActionCell.js';
import { TextCell } from './TextCell.js';

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
