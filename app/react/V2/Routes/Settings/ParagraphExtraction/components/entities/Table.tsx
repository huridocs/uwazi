import React from 'react';
import { Table } from 'V2/Components/UI';
import { TablePXEntityRow } from 'V2/shared/ParagraphExtractionTypes';
import { Template } from 'app/apiResponseTypes';
import { TableTitle } from '../TableTitle';
import { PXTableFooter } from '../PXTableFooter';
import { PXTemplate } from '../../types';
import { columns } from './TableElements';
import { FilterSidePanel } from '../FilterSidePanel';

interface EntitiesTableProps {
  pxEntitiesData: TablePXEntityRow[];
  // onSelectionChange: (selected: PXEntityTable[]) => void;
  sourceTemplate?: Template;
  // filters: any[];
}

const EntitiesTable = ({
  pxEntitiesData,
  onSelectionChange,
  sourceTemplate,
  // filters,
}: EntitiesTableProps) => (
  <Table
    data={pxEntitiesData}
    columns={columns}
    enableSelections
    header={
      // <TableTitle
      //   items={sourceTemplate ? [sourceTemplate] : []}
      //   Buttons={filters.length > 0 && <FilterSidePanel availableFilters={filters} />}
      // />
      <TableTitle items={sourceTemplate ? [sourceTemplate] : []} />
    }
    onChange={({ selectedRows }) => {
      onSelectionChange(pxEntitiesData.filter(ex => ex.rowId in selectedRows));
    }}
    footer={<PXTableFooter totalPages={10} total={100} currentDataLength={10} />}
  />
);

export { EntitiesTable };
