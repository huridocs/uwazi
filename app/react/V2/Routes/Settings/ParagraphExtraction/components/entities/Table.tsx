import React from 'react';
import { Table } from '#V2/Components/UI/index.js';
import { TablePXEntityRow } from '#V2/shared/ParagraphExtractionTypes.js';
import { Template } from '#app/apiResponseTypes.js';
import { TableTitle } from '../TableTitle.js';
import { PXTableFooter } from '../PXTableFooter.js';
import { columns } from './TableElements/index.js';
import { FilterSidepanelButton } from '../FilterSidePanel/FilterSidepanelButton.js';

interface EntitiesTableProps {
  pxEntitiesData: TablePXEntityRow[];
  onSelectionChange: (selected: TablePXEntityRow[]) => void;
  sourceTemplate?: Template;
  totalRows: number;
  initialSelection: TablePXEntityRow[];
}

const EntitiesTable = ({
  pxEntitiesData,
  onSelectionChange,
  sourceTemplate,
  totalRows,
  initialSelection,
}: EntitiesTableProps) => (
  <Table
    data={pxEntitiesData}
    columns={columns}
    enableSelections
    initialSelection={initialSelection}
    header={<TableTitle items={sourceTemplate ? [sourceTemplate] : []} />}
    actions={<FilterSidepanelButton />}
    onSelect={({ selectedRows }) => {
      onSelectionChange(pxEntitiesData.filter(ex => ex.rowId in selectedRows));
    }}
    footer={<PXTableFooter total={totalRows} currentDataLength={pxEntitiesData.length} />}
  />
);

export { EntitiesTable };
