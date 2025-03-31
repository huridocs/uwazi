import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { PXTable } from '../../../types';
import { generateDisplayPill } from '../../../utils/generateDisplayPill';

const DisplayPill = generateDisplayPill({
  label: 'New',
});

const EntityCountCell = ({ cell }: CellContext<PXTable, PXTable['count']>) => {
  if (!cell.getValue()) {
    return null;
  }

  const { generatedEntities, new: newEntities } = cell.getValue();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-normal text-gray-500">{generatedEntities}</span>
      {newEntities > 0 && <DisplayPill count={newEntities} />}
    </div>
  );
};

export { EntityCountCell };
