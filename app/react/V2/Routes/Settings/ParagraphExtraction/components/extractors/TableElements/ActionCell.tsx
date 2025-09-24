import React from 'react';
import { CellContext } from '@tanstack/react-table';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
import { Link } from 'react-router';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button } from '../../V2/Components/UI.js';
import { PXTable } from '../../../types';

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
