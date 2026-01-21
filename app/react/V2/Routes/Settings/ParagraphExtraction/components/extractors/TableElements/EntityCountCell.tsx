import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { PXTable } from '#V2/Routes/Settings/ParagraphExtraction/types.js';
import { generateDisplayPill } from '#V2/Routes/Settings/ParagraphExtraction/utils/generateDisplayPill.jsx';

const DisplayPill = generateDisplayPill({
  label: 'New',
});

const EntityCountCell = ({ cell }: CellContext<PXTable, PXTable['statusCount']>) => {
  const values = cell.getValue();

  const newCount = values.new;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-normal text-gray-500">{values.total}</span>
      {Boolean(newCount) && <DisplayPill count={newCount} />}
    </div>
  );
};

export { EntityCountCell };
