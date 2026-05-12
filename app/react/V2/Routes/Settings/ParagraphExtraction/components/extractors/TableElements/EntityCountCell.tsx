import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { PXTable } from '../../../types.js';
import { generateDisplayPill } from '../../../utils/generateDisplayPill.js';

const DisplayPill = generateDisplayPill({
  label: 'New',
});

const EntityCountCell = ({ cell }: CellContext<PXTable, PXTable['statusCount']>) => {
  const values = cell.getValue();

  const newCount = values.new;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-normal text-(--color-theme-text-secondary)">
        {values.total}
      </span>
      {Boolean(newCount) && <DisplayPill count={newCount} />}
    </div>
  );
};

export { EntityCountCell };
