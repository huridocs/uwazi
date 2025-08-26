import React from 'react';
import { Table } from 'V2/Components/UI';
import { TablePXEntityRow } from 'V2/shared/ParagraphExtractionTypes';
import { Template } from 'app/apiResponseTypes';
import { TableTitle } from '../TableTitle';
import { PXTableFooter } from '../PXTableFooter';
import { columns } from './TableElements';
import { FilterSidepanelButton } from '../FilterSidePanel/FilterSidepanelButton';

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
