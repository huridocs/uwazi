import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { Link } from 'react-router';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { TablePXEntityRow } from 'V2/shared/ParagraphExtractionTypes';

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
