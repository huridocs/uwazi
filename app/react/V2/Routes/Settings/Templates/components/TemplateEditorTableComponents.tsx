/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Button } from 'V2/Components/UI/Button';
import { ColumnDef, createColumnHelper, CellContext } from '@tanstack/react-table';
import { PropertySchema } from 'shared/types/commonTypes';
import { Translate } from 'app/I18N/Translate';
import { propertyIcons } from 'V2/Components/UI/Icons';
import { Pill } from 'V2/Components/UI';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { translationsKeys } from '../helpers';

type PropertyRow = PropertySchema & {
  rowId: string;
  disableRowDnD?: boolean;
  disableRowSelection?: boolean;
};

const columnHelper = createColumnHelper<PropertyRow>();

const LabelCell =
  (handleEditProperty: (property: PropertyRow) => void) =>
  ({ cell }: CellContext<PropertyRow, string>) => {
    const property = cell.row.original;
    if (property.disableRowDnD) {
      return (
        <button
          type="button"
          onClick={() => handleEditProperty(property)}
          className="flex items-center gap-2 text-left text-primary-700 cursor-pointer font-medium"
        >
          <LockClosedIcon className="w-4 h-4 text-primary-700" />
          {cell.getValue()}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => handleEditProperty(property)}
        className="text-left text-primary-700 cursor-pointer font-medium"
      >
        {cell.getValue()}
      </button>
    );
  };

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

  const propertyFlags = [
    { key: 'show-in-cards', condition: property.showInCard, label: 'Show in cards' },
    { key: 'no-label', condition: property.noLabel, label: 'No label' },
    { key: 'use-as-filter', condition: property.filter, label: 'Use as filter' },
    { key: 'priority', condition: property.prioritySorting, label: 'Priority sorting' },
    { key: 'required', condition: property.required, label: 'Required' },
    { key: 'defaultfilter', condition: property.defaultfilter, label: 'Default filter' },
    { key: 'generated-id', condition: property.generatedId, label: 'Generated ID' },
    { key: 'full-width', condition: property.fullWidth, label: 'Full width' },
  ];

  const pills = propertyFlags
    .filter(flag => flag.condition)
    .map(flag => (
      <Pill key={flag.key} color="gray">
        <Translate>{flag.label}</Translate>
      </Pill>
    ));

  return <div className="flex flex-wrap gap-2">{pills}</div>;
};

const propertyColumns: (
  handleEditProperty: (property: PropertyRow) => void
) => ColumnDef<PropertyRow, any>[] = handleEditProperty => [
  columnHelper.accessor('label', {
    id: 'label',
    header: LabelHeader,
    cell: LabelCell(handleEditProperty),
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
