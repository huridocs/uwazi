import React from 'react';
import { TableCellsIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { ViewerPlaceholder } from './ViewerPlaceholder.js';

const TableViewer = () => (
  <ViewerPlaceholder
    icon={<TableCellsIcon className="h-8 w-8 text-ink-muted" />}
    title={<Translate>Table</Translate>}
    description="Table view is not available yet."
  />
);

export { TableViewer };
