/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { FileType } from 'shared/types/fileType';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';

const columnHelper = createColumnHelper<FileType>();

const TitleHeader = () => <Translate>Name</Translate>;
const PreviewHeader = () => <Translate>Preview</Translate>;
const URLHeader = () => <Translate>URL</Translate>;

const TitleCell = ({ getValue }: CellContext<FileType, string>) => <div>{getValue()}</div>;
const PreviewCell = () => <div>here goes the preview</div>;
const URLCell = ({ getValue }: CellContext<FileType, string>) => `/assets/${getValue()}`;
const ActionCell = ({ getValue }: CellContext<FileType, string>) => (
  <Button
    styling="outline"
    color="error"
    className="leading-3"
    onClick={() => {
      console.log(getValue());
    }}
  >
    <Translate>Delete</Translate>
  </Button>
);

const createColumns = () => [
  columnHelper.display({
    id: 'preview',
    header: PreviewHeader,
    cell: PreviewCell,
  }),
  columnHelper.accessor('originalname', {
    id: 'originalname',
    header: TitleHeader,
    cell: TitleCell,
  }),
  columnHelper.accessor('filename', {
    id: 'filename',
    header: URLHeader,
    cell: URLCell,
    enableSorting: false,
    meta: { headerClassName: 'w-2/4' },
  }),
  columnHelper.accessor('_id', {
    id: 'action',
    header: () => null,
    cell: ActionCell,
    enableSorting: false,
  }),
];

export { createColumns };
