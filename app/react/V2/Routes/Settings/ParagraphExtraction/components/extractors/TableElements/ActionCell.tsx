import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { Translate } from '#app/I18N/index.js';
import { Link } from 'react-router';
import { Button } from '#V2/Components/UI/index.js';
import { PXTable } from '../../../types.js';

const ActionCell = ({ cell }: CellContext<PXTable, PXTable['_id']>) => (
  <div className="flex gap-2 justify-end">
    <Link to={`${cell.getValue()}/entities/?page=1`}>
      <Button className="leading-4" styling="outline">
        <Translate>View</Translate>
      </Button>
    </Link>
  </div>
);

export { ActionCell };
