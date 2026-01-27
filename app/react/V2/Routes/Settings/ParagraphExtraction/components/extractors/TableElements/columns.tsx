import { createColumnHelper } from '@tanstack/react-table';
import { TemplateCell } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/TableElements/TemplateCell.js';
import { EntityCountCell } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/TableElements/EntityCountCell.js';
import { ActionCell } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/TableElements/ActionCell.js';
import { generateTableHeader } from '#V2/Routes/Settings/ParagraphExtraction/utils/generateTableHeader.js';
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
