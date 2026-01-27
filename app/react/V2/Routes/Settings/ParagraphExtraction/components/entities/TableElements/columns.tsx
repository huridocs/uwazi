import { createColumnHelper } from '@tanstack/react-table';
import { TablePXEntityRow } from '#V2/shared/ParagraphExtractionTypes.js';
import { DisplayCell } from '#V2/Routes/Settings/ParagraphExtraction/components/entities/TableElements/DisplayCell.js';
import { LanguagesCell } from '#V2/Routes/Settings/ParagraphExtraction/components/entities/TableElements/LanguagesCell.js';
import { StatusCell } from '#V2/Routes/Settings/ParagraphExtraction/components/entities/TableElements/StatusCell.js';
import { generateTableHeader } from '#V2/Routes/Settings/ParagraphExtraction/utils/generateTableHeader.js';
import { ActionCell } from '#V2/Routes/Settings/ParagraphExtraction/components/entities/TableElements/ActionCell.js';

const pxColumnHelper = createColumnHelper<TablePXEntityRow>();

const columns = [
  pxColumnHelper.accessor('entity.title', {
    header: generateTableHeader('Entity'),
    cell: DisplayCell,
    meta: { headerClassName: 'w-4/12' },
    enableSorting: false,
  }),
  pxColumnHelper.accessor('availableFileLanguages', {
    header: generateTableHeader('Language(s)'),
    cell: LanguagesCell,
    meta: { headerClassName: 'w-3/12' },
    enableSorting: false,
  }),
  pxColumnHelper.accessor('paragraphsCount', {
    header: generateTableHeader('Paragraphs'),
    cell: DisplayCell,
    meta: { headerClassName: 'w-2/12' },
    enableSorting: false,
  }),
  pxColumnHelper.accessor('status', {
    header: generateTableHeader('Status'),
    cell: StatusCell,
    meta: { headerClassName: 'w-2/12' },
    enableSorting: false,
  }),
  pxColumnHelper.accessor('entity.sharedId', {
    header: generateTableHeader('Action', { className: 'sr-only' }),
    cell: ActionCell,
    meta: { headerClassName: 'w-1/12' },
    enableSorting: false,
  }),
];

export { columns };
