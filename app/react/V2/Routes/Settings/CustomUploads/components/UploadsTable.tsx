/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Button, FileIcon } from 'V2/Components/UI';
import { CustomUpload } from '../CustomUploads';

const columnHelper = createColumnHelper<CustomUpload>();

const TitleHeader = () => <Translate>Name</Translate>;
const PreviewHeader = () => <Translate>Preview</Translate>;
const URLHeader = () => <Translate>URL</Translate>;
const ActionHeader = () => <Translate className="sr-only">Action</Translate>;

const TitleCell = ({ getValue }: CellContext<CustomUpload, string>) => getValue();
const URLCell = ({ getValue }: CellContext<CustomUpload, string>) => `/assets/${getValue()}`;
const PreviewCell = ({ cell }: CellContext<CustomUpload, any>) => {
  const { mimetype = '', originalname, filename } = cell.row.original;
  return (
    <div className="flex justify-center items-center">
      <FileIcon
        mimetype={mimetype}
        filename={filename!}
        altText={originalname}
        className={`flex justify-center items-center ${/^image\//.test(mimetype) ? 'w-14 h-14' : 'w-10 h-14'}`}
      />
    </div>
  );
};

const ActionCell = ({ cell }: CellContext<CustomUpload, any>) => {
  const actions = cell.column.columnDef.meta?.action
    ? cell.column.columnDef.meta?.action()
    : undefined;

  return (
    <div className="flex flex-nowrap gap-2">
      <Button
        styling="outline"
        color="primary"
        className="leading-3"
        onClick={() => actions.edit(cell.row.original)}
      >
        <Translate>Edit</Translate>
      </Button>
      <Button
        styling="outline"
        color="error"
        className="leading-3"
        onClick={() => actions.delete(cell.row.original)}
      >
        <Translate>Delete</Translate>
      </Button>
    </div>
  );
};

const createColumns = (
  handleDelete: (file: CustomUpload) => void,
  editFile: (file: CustomUpload) => void
) => [
  columnHelper.display({
    id: 'preview',
    header: PreviewHeader,
    cell: PreviewCell,
    meta: { headerClassName: 'w-0' },
  }),
  columnHelper.accessor('originalname', {
    id: 'originalname',
    header: TitleHeader,
    cell: TitleCell,
    meta: { headerClassName: 'w-2/4' },
  }),
  columnHelper.accessor('filename', {
    id: 'filename',
    header: URLHeader,
    cell: URLCell,
    enableSorting: false,
    meta: { headerClassName: 'w-2/4' },
  }),
  columnHelper.display({
    id: 'action',
    header: ActionHeader,
    cell: ActionCell,
    enableSorting: false,
    meta: { action: () => ({ delete: handleDelete, edit: editFile }) },
  }),
];

export { createColumns };
