import React from 'react';
import { CellContext, ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Button, Pill } from 'V2/Components/UI';
import { StarIcon } from '@heroicons/react/20/solid';
import { Translate, I18NLink } from 'app/I18N';
import { TemplateRow } from '../types';
import { Tooltip } from 'flowbite-react';

const columnHelper = createColumnHelper<TemplateRow>();

const NameCell = ({ cell }: CellContext<TemplateRow, string>) => (
  <div className="flex items-center gap-2">
    {cell.row.original.synced ? (
      <span className="text-primary-700 cursor-not-allowed">{cell.getValue()}</span>
    ) : (
      <I18NLink
        to={`/settings/templates/edit/${cell.row.original._id}`}
        className="text-primary-700 hover:underline cursor-pointer"
      >
        {cell.getValue()}
      </I18NLink>
    )}
    {cell.row.original.default && <Pill color="blue">Default</Pill>}
  </div>
);

const TranslationCell = ({ cell }: CellContext<TemplateRow, string>) => (
  <Translate context={cell.row.original._id}>{cell.getValue()}</Translate>
);

function formatNumberShort(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1) + 'k';
  }
  return value.toString();
}

const EntityCountCell = ({ cell }: CellContext<TemplateRow, number>) => (
  <span>{formatNumberShort(cell.getValue())}</span>
);

const DefaultButton =
  (handleSetDefault: (row: TemplateRow) => void) =>
  ({ cell }: CellContext<TemplateRow, boolean>) => {
    return (
      <Button
        styling={cell.row.original.default ? 'solid' : 'light'}
        onClick={() => handleSetDefault(cell.row.original)}
        className="leading-4 m-auto"
        disabled={cell.row.original.default || cell.row.original.synced}
      >
        <StarIcon
          className={
            cell.row.original.default
              ? 'w-4 text-white'
              : 'w-4 text-white stroke-current stroke-gray-300 stroke-2'
          }
        />
      </Button>
    );
  };

const EditButton = ({ cell }: CellContext<TemplateRow, string>) => (
  <I18NLink to={`/settings/templates/edit/${cell.row.original._id}`} className="px-3 py-1">
    <Button styling="light" disabled={cell.row.original.synced} className="leading-4">
      <Translate>Edit</Translate>
    </Button>
  </I18NLink>
);

const NameHeader = () => <Translate>Name</Translate>;
const TranslationHeader = () => <Translate>Translation</Translate>;
const EntityCountHeader = () => <Translate>Entities</Translate>;
const DefaultHeader = () => <Translate className="keep-all">Set as default</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;

const SyncedTemplateCell = ({ cell }: CellContext<TemplateRow, boolean>) =>
  cell.getValue() ? (
    <Tooltip
      content={
        <div className="text-xs text-gray-600">
          The source of this template is a sync.
          <br />
          All editing options will be disabled.
        </div>
      }
      // eslint-disable-next-line react/style-prop-object
      style="light"
    >
      <span className="cursor-help">
        <Translate>Synced template</Translate>
      </span>
    </Tooltip>
  ) : null;
const SyncedTemplateHeader = () => <Translate>Synced Template</Translate>;

const columns = (
  handleSetDefault: (row: TemplateRow) => void,
  hasSyncedTemplates = false
): ColumnDef<TemplateRow, any>[] => {
  const cols: ColumnDef<TemplateRow, any>[] = [
    columnHelper.accessor('name', {
      id: 'name',
      header: NameHeader,
      cell: NameCell,
      enableSorting: true,
    }),
    columnHelper.accessor('translation', {
      id: 'translation',
      header: TranslationHeader,
      cell: TranslationCell,
      enableSorting: true,
    }),
  ];

  if (hasSyncedTemplates) {
    cols.push(
      columnHelper.accessor('synced', {
        id: 'synced',
        header: SyncedTemplateHeader,
        cell: SyncedTemplateCell,
        meta: { headerClassName: 'w-2/12 text-center' },
      })
    );
  }

  cols.push(
    columnHelper.accessor('entityCount', {
      id: 'entityCount',
      header: EntityCountHeader,
      cell: EntityCountCell,
      enableSorting: true,
      meta: { headerClassName: 'w-09ext-center' },
    }),
    columnHelper.accessor('default', {
      id: 'default',
      header: DefaultHeader,
      cell: DefaultButton(handleSetDefault),
      enableSorting: false,
      meta: { headerClassName: 'w-1/12 text-center', contentClassName: 'text-center' },
    }),
    columnHelper.accessor('_id', {
      id: 'actions',
      header: ActionHeader,
      cell: EditButton,
      enableSorting: false,
      meta: { headerClassName: 'w-0 text-center', contentClassName: 'text-center' },
    })
  );
  return cols;
};

export {
  NameCell,
  TranslationCell,
  DefaultButton,
  EditButton,
  NameHeader,
  TranslationHeader,
  DefaultHeader,
  ActionHeader,
  EntityCountCell,
  EntityCountHeader,
  SyncedTemplateCell,
  SyncedTemplateHeader,
  columns,
};
