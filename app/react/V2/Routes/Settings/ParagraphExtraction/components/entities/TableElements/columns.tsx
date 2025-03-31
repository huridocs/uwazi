import { createColumnHelper } from '@tanstack/react-table';
import { PXEntityTable } from '../../../types';
import { DisplayCell } from './DisplayCell';
import { LanguagesCell } from './LanguagesCell';
import { StatusCell } from './StatusCell';
import { generateTableHeader } from '../../../utils/generateTableHeader';
import { ActionCell } from './ActionCell';

const pxColumnHelper = createColumnHelper<PXEntityTable>();

const columns = [
  pxColumnHelper.accessor('title', {
    header: generateTableHeader('Entity'),
    enableSorting: true,
    cell: DisplayCell,
    meta: { headerClassName: 'w-4/12' },
  }),
  pxColumnHelper.accessor('languages', {
    header: generateTableHeader('Language(s)'),
    enableSorting: true,
    cell: LanguagesCell,
    meta: { headerClassName: 'w-3/12' },
  }),
  pxColumnHelper.accessor('paragraphCount', {
    header: generateTableHeader('Paragraphs'),
    enableSorting: true,
    cell: DisplayCell,
    meta: { headerClassName: 'w-2/12' },
  }),
  pxColumnHelper.accessor('status', {
    header: generateTableHeader('Status'),
    enableSorting: true,
    cell: StatusCell,
    meta: { headerClassName: 'w-2/12' },
  }),
  pxColumnHelper.accessor('_id', {
    header: generateTableHeader(''),
    enableSorting: false,
    cell: ActionCell,
    meta: { headerClassName: 'w-1/12' },
  }),
];

export { columns };
