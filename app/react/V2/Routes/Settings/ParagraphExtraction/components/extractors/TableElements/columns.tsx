import { createColumnHelper } from '@tanstack/react-table';
import { TemplateCell } from './TemplateCell.js';
import { EntityCountCell } from './EntityCountCell.js';
import { ActionCell } from './ActionCell.js';
import { generateTableHeader } from '../../../utils/generateTableHeader.js';
import { PXTable } from '../../../types.js';

const extractorColumnHelper = createColumnHelper<PXTable>();

const columns = [
  extractorColumnHelper.accessor('sourceTemplate', {
    header: generateTableHeader('Source Template'),
    enableSorting: true,
    cell: TemplateCell,
    meta: {
      headerClassName: 'w-1/4',
    },
  }),
  extractorColumnHelper.accessor('targetTemplate', {
    header: generateTableHeader('Target Template'),
    enableSorting: true,
    cell: TemplateCell,
    meta: {
      headerClassName: 'w-1/4',
    },
  }),
  extractorColumnHelper.accessor('statusCount', {
    header: generateTableHeader('Entities'),
    enableSorting: true,
    cell: EntityCountCell,
    meta: {
      headerClassName: 'w-1/4',
    },
  }),
  extractorColumnHelper.accessor('_id', {
    header: generateTableHeader('Action', { className: 'sr-only' }),
    enableSorting: false,
    cell: ActionCell,
  }),
];

export { columns };
