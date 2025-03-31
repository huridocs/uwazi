import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { Link } from 'react-router';
import { PXEntityTable } from '../../../types';

const ActionCell = ({ cell }: CellContext<PXEntityTable, PXEntityTable['_id']>) => (
  <div className="flex gap-2 justify-end">
    <Link to={`${cell.getValue()}/paragraphs`}>
      <Button className="leading-4" styling="outline">
        <Translate>View</Translate>
      </Button>
    </Link>
  </div>
);

export { ActionCell };
