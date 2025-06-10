/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Button } from 'V2/Components/UI/Button';
import { ColumnDef, createColumnHelper, CellContext } from '@tanstack/react-table';
import { PropertySchema } from 'shared/types/commonTypes';
import { Translate } from 'app/I18N/Translate';
import { propertyIcons } from 'V2/Components/UI/Icons';
import { Pill } from 'V2/Components/UI';
import { translationsKeys } from '../helpers';

type PropertyRow = PropertySchema & {
  rowId: string;
  disableRowDnD?: boolean;
  disableRowSelection?: boolean;
};

const columnHelper = createColumnHelper<PropertyRow>();

const LabelCell = ({ cell }: CellContext<PropertyRow, string>) => <span>{cell.getValue()}</span>;

const TypeCell = ({ cell }: CellContext<PropertyRow, string>) => (
  <div className="flex items-center gap-2">
    {propertyIcons[cell.getValue() as keyof typeof propertyIcons]}
    <Translate context="System" className="capitalize">
      {translationsKeys[cell.getValue() as keyof typeof translationsKeys] || cell.getValue()}
    </Translate>
  </div>
);

const ActionsCell =
  (handleEditProperty: (property: PropertyRow) => void) =>
  ({ cell }: CellContext<PropertyRow, any>) => (
    <Button size="small" styling="light" onClick={() => handleEditProperty(cell.row.original)}>
      <Translate>Edit</Translate>
    </Button>
  );

const LabelHeader = () => <Translate>Property</Translate>;
const TypeHeader = () => <Translate>Type</Translate>;
const ActionsHeader = () => <Translate>Action</Translate>;
const OptionsHeader = () => <Translate>Options</Translate>;

// eslint-disable-next-line max-statements
const OptionsCell = ({ row }: CellContext<PropertyRow, any>) => {
  const property = row.original;
  const pills: React.ReactNode[] = [];
  if (property.prioritySorting) {
    pills.push(
      <Pill key="priority" color="gray">
        <Translate>Priority sorting</Translate>
      </Pill>
    );
  }
  if (property.showInCard) {
    pills.push(
      <Pill key="show-in-cards" color="gray">
        <Translate>Show in cards</Translate>
      </Pill>
    );
  }
  if (property.noLabel) {
    pills.push(
      <Pill key="no-label" color="gray">
        <Translate>No label</Translate>
      </Pill>
    );
  }
  if (property.filter) {
    pills.push(
      <Pill key="use-as-filter" color="gray">
        <Translate>Use as filter</Translate>
      </Pill>
    );
  }
  if (property.required) {
    pills.push(
      <Pill key="required" color="gray">
        <Translate>Required</Translate>
      </Pill>
    );
  }
  if (property.defaultfilter) {
    pills.push(
      <Pill key="defaultfilter" color="gray">
        <Translate>Default filter</Translate>
      </Pill>
    );
  }
  // Add more pills as needed for other property configs
  return <div className="flex flex-wrap gap-2">{pills}</div>;
};

const propertyColumns: (
  handleEditProperty: (property: PropertyRow) => void
) => ColumnDef<PropertyRow, any>[] = handleEditProperty => [
  columnHelper.accessor('label', {
    id: 'label',
    header: LabelHeader,
    cell: LabelCell,
    enableSorting: false,
  }),
  columnHelper.accessor('type', {
    id: 'type',
    header: TypeHeader,
    cell: TypeCell,
    meta: { headerClassName: 'w-2/12' },
    enableSorting: false,
  }),
  {
    id: 'options',
    header: OptionsHeader,
    cell: OptionsCell,
  },
  {
    id: 'actions',
    header: ActionsHeader,
    cell: ActionsCell(handleEditProperty),
    meta: { headerClassName: 'w-0 text-center', contentClassName: 'text-center' },
  },
];

export { propertyColumns };
export type { PropertyRow };
