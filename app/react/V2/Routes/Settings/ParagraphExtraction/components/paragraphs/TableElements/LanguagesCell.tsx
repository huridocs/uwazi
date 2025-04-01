import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { Pill } from 'app/V2/Components/UI';
import { PXParagraphTable } from '../../../types';

const LanguagesCell = ({ cell }: CellContext<PXParagraphTable, PXParagraphTable['languages']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue().map(value => (
      <div key={value} className="whitespace-nowrap uppercase text-xs font-medium">
        <Pill color="gray">{value}</Pill>
      </div>
    ))}
  </div>
);

export { LanguagesCell };
