import React from 'react';
import { Table } from 'V2/Components/UI';
import { TableTitle } from '../TableTitle';
import { PXTableFooter } from '../PXTableFooter';
import { PXEntityTable, PXTemplate } from '../../types';
import { columns } from './TableElements';
import { FilterSidePanel } from '../FilterSidePanel';

interface EntitiesTableProps {
  pxEntitiesData: PXEntityTable[];
  onSelectionChange: (selected: PXEntityTable[]) => void;
  sourceTemplate?: PXTemplate;
  filters: any[];
}

const EntitiesTable = ({
  pxEntitiesData,
  onSelectionChange,
  sourceTemplate,
  filters,
}: EntitiesTableProps) => (
  <Table
    data={pxEntitiesData}
    columns={columns}
    enableSelections
    header={
      <TableTitle
        items={sourceTemplate ? [sourceTemplate] : []}
        Buttons={filters.length > 0 && <FilterSidePanel availableFilters={filters} />}
      />
    }
    onChange={({ selectedRows }) => {
      onSelectionChange(pxEntitiesData.filter(ex => ex.rowId in selectedRows));
    }}
    defaultSorting={[{ id: '_id', desc: false }]}
    footer={<PXTableFooter totalPages={10} total={100} currentDataLength={10} />}
  />
);

export { EntitiesTable };
