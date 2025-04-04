import { createColumnHelper } from '@tanstack/react-table';
import { TablePXEntityParagraphRow } from 'app/V2/shared/ParagraphExtractionTypes';
import { generateTableHeader } from '../../../utils/generateTableHeader';
import { LanguagesCell } from './LanguagesCell';
import { ParagraphCountCell } from './ParagraphCountCell';
import { ActionCell } from './ActionCell';
import { TextCell } from './TextCell';

const pxColumnHelper = createColumnHelper<TablePXEntityParagraphRow>();

const tableBuilder = ({ onViewAction }: { onViewAction: (paragraphId: string) => void }) => [
  pxColumnHelper.accessor('entities.title', {
    header: generateTableHeader('Paragraph #'),
    cell: ParagraphCountCell,
    enableSorting: false,
    meta: { headerClassName: 'w-1/6' },
  }),
  pxColumnHelper.accessor('entities.language', {
    header: generateTableHeader('Language'),
    cell: LanguagesCell,
    enableSorting: false,
    meta: { headerClassName: 'w-1/6' },
  }),
  pxColumnHelper.accessor('entities.title', {
    header: generateTableHeader('Text'),
    cell: TextCell,
    enableSorting: false,
    meta: { headerClassName: 'w-4/6' },
  }),
  pxColumnHelper.accessor('entities.title', {
    header: generateTableHeader(''),
    cell: props =>
      ActionCell(() => {
        const paragraphId = props.cell.getValue();
        if (paragraphId) {
          onViewAction('1');
        }
      }),
    enableSorting: false,
  }),
];

export { tableBuilder };
