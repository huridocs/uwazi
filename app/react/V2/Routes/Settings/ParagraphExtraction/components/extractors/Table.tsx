import React from 'react';
import { Table } from '#V2/Components/UI/index.js';

import { Translate } from '#app/I18N/index.js';
import {
  columns,
  NoDataCell,
} from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/TableElements/index.js';
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
