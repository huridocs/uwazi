import React from 'react';
import { Table } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { columns, NoDataCell } from './TableElements';
import { PXTable } from '../../types';

interface ExtractorsTableProps {
  paragraphExtractorData: PXTable[];
  onSelectionChange: (selected: PXTable[]) => void;
}

const ExtractorsTable = ({ paragraphExtractorData, onSelectionChange }: ExtractorsTableProps) => (
  <Table
    data={paragraphExtractorData}
    columns={columns}
    header={
      <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
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
