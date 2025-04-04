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
  }),
  pxColumnHelper.accessor('entities.language', {
    header: generateTableHeader('Language'),
    cell: LanguagesCell,
    enableSorting: false,
  }),
  pxColumnHelper.accessor('entities.title', {
    header: generateTableHeader('Text'),
    cell: TextCell,
    meta: { headerClassName: 'w-5/6' },
    enableSorting: false,
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
