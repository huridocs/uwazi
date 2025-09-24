import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { Link } from 'react-router';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button } from '../../V2/Components/UI.js';
import { TablePXEntityRow } from '../../../../../../shared/ParagraphExtractionTypes.js';

const ActionCell = ({
  cell,
  // @ts-expect-error TS(2339): Property 'sharedId' does not exist on type 'Client... Remove this comment to see the full error message
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
