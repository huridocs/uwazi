import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { PXEntityTable } from '../../../types';

const DisplayCell = ({
  cell,
}: CellContext<
  PXEntityTable,
  PXEntityTable['title'] | PXEntityTable['document'] | PXEntityTable['paragraphCount']
>) => <span className="text-xs font-medium text-gray-900">{cell.getValue()}</span>;

export { DisplayCell };
