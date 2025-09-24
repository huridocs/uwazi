import React from 'react';
import { Table } from '../../../../../Components/UI/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
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
