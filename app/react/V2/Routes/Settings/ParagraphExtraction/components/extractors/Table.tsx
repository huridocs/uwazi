import React from 'react';
import { Table } from '#V2/Components/UI/index.js';
import { Translate } from '#app/I18N/index.js';
import { columns, NoDataCell } from './TableElements/index.js';
import { PXTable } from '../../types.js';

interface ExtractorsTableProps {
  paragraphExtractorData: PXTable[];
  onSelectionChange: (selected: PXTable[]) => void;
}

const ExtractorsTable = ({ paragraphExtractorData, onSelectionChange }: ExtractorsTableProps) => (
  <Table
    data={paragraphExtractorData}
    columns={columns}
    header={
      <Translate className="text-left text-base font-semibold [color:var(--color-theme-text-primary)]">
        Extractors
      </Translate>
    }
    enableSelections
    onSelect={({ selectedRows }) => {
      onSelectionChange(paragraphExtractorData.filter(ex => ex.rowId in selectedRows));
    }}
    noDataMessage={<NoDataCell />}
  />
);

export { ExtractorsTable };
