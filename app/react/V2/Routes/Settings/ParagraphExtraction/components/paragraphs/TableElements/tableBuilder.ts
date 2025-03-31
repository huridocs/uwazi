import { createColumnHelper } from '@tanstack/react-table';
import { generateTableHeader } from '../../../utils/generateTableHeader';
import { LanguagesCell } from './LanguagesCell';
import { ParagraphCountCell } from './ParagraphCountCell';
import { PXParagraphTable } from '../../../types';
import { ActionCell } from './ActionCell';
import { TextCell } from './TextCell';

const pxColumnHelper = createColumnHelper<PXParagraphTable>();

const tableBuilder = ({ onViewAction }: { onViewAction: (paragraphId: string) => void }) => [
  pxColumnHelper.accessor('paragraphCount', {
    header: generateTableHeader('Paragraph #'),
    cell: ParagraphCountCell,
    enableSorting: false,
  }),
  pxColumnHelper.accessor('languages', {
    header: generateTableHeader('Language'),
    cell: LanguagesCell,
    enableSorting: true,
  }),
  pxColumnHelper.accessor('text', {
    header: generateTableHeader('Text'),
    cell: TextCell,
    meta: { headerClassName: 'w-5/6' },
    enableSorting: true,
  }),
  pxColumnHelper.accessor('_id', {
    header: generateTableHeader(''),
    cell: props =>
      ActionCell(() => {
        const paragraphId = props.cell.getValue();
        if (paragraphId) {
          onViewAction(paragraphId);
        }
      }),
    enableSorting: false,
  }),
];

export { tableBuilder };
