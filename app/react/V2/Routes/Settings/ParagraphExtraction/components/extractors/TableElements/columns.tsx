import { createColumnHelper } from '@tanstack/react-table';
import { TemplateCell } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/TableElements/TemplateCell.jsx';
import { EntityCountCell } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/TableElements/EntityCountCell.jsx';
import { ActionCell } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/TableElements/ActionCell.jsx';
import { generateTableHeader } from './../../../utils/generateTableHeader.js';
import { PXTable } from '#V2/Routes/Settings/ParagraphExtraction/types.js';

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
