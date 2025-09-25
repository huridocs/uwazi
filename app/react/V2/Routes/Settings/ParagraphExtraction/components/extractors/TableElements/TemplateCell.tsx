import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { DisplayPill } from '#app/V2/Routes/Settings/ParagraphExtraction/components/paragraphs/DisplayPills';
import { PXTable } from '#app/V2/Routes/Settings/ParagraphExtraction/types';

const TemplateCell = ({
  cell,
}: CellContext<PXTable, PXTable['targetTemplate'] | PXTable['sourceTemplate']>) => (
  <div className="flex flex-wrap gap-2">
    <div className="whitespace-nowrap">
      <DisplayPill color={cell.getValue().color}>
        <span className="text-xs font-medium">{cell.getValue().name}</span>
      </DisplayPill>
    </div>
  </div>
);

export { TemplateCell };
