import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { Link } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { TablePXEntityRow } from '#V2/shared/ParagraphExtractionTypes.js';

const ActionCell = ({
  cell,
}: CellContext<TablePXEntityRow, TablePXEntityRow['entity']['sharedId']>) => (
  <div className="flex gap-2 justify-end">
    <Link to={`${cell.getValue()}/paragraphs`}>
      <Button className="leading-4" styling="outline">
        <Translate>View</Translate>
      </Button>
    </Link>
  </div>
);

export { ActionCell };
