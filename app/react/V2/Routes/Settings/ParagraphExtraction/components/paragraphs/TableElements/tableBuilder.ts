import { createColumnHelper } from '@tanstack/react-table';
import { TablePXEntityParagraphRow } from 'app/V2/shared/ParagraphExtractionTypes';
import { generateTableHeader } from '../../../utils/generateTableHeader';
import { LanguagesCell } from './LanguagesCell';
import { ParagraphCountCell } from './ParagraphCountCell';
import { ActionCell } from './ActionCell';
import { TextCell } from './TextCell';

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
