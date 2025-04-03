import React from 'react';
import { Table } from 'V2/Components/UI';
import { TablePXEntityRow } from 'V2/shared/ParagraphExtractionTypes';
import { Template } from 'app/apiResponseTypes';
import { TableTitle } from '../TableTitle';
import { PXTableFooter } from '../PXTableFooter';
import { PXTemplate } from '../../types';
import { columns } from './TableElements';
import { FilterSidepanelButton } from '../FilterSidePanel/FilterSidepanelButton';

interface EntitiesTableProps {
  pxEntitiesData: TablePXEntityRow[];
  onSelectionChange: (selected: TablePXEntityRow[]) => void;
  sourceTemplate?: Template;
}

const EntitiesTable = ({
  pxEntitiesData,
  onSelectionChange,
  sourceTemplate,
}: EntitiesTableProps) => (
  <Table
    data={pxEntitiesData}
    columns={columns}
    enableSelections
    header={
      <TableTitle
        items={sourceTemplate ? [sourceTemplate] : []}
        Buttons={<FilterSidepanelButton />}
      />
    }
    onChange={({ selectedRows }) => {
      onSelectionChange(pxEntitiesData.filter(ex => ex.rowId in selectedRows));
    }}
    footer={<PXTableFooter totalPages={10} total={100} currentDataLength={10} />}
  />
);

export { EntitiesTable };
