/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { FileType } from 'shared/types/fileType';
import { Translate } from 'app/I18N';

const columnHelper = createColumnHelper<FileType>();

const TitleHeader = () => <Translate>Name</Translate>;
const PreviewHeader = () => <Translate>Preview</Translate>;
const URLHeader = () => <Translate>URL</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;

const TitleCell = ({ getValue }: CellContext<FileType, string>) => <div>{getValue()}</div>;
const PreviewCell = () => <div>here goes the preview</div>;
const URLCell = ({ getValue }: CellContext<FileType, string>) => <div>{getValue()}</div>;
const ActionCell = ({ getValue }: CellContext<FileType, string>) => <div>{getValue()}</div>;

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
    // meta: { headerClassName: 'w-6/12' },
  }),
  columnHelper.accessor('filename', {
    id: 'filename',
    header: URLHeader,
    cell: URLCell,
  }),
  columnHelper.accessor('_id', {
    id: 'action',
    header: ActionHeader,
    cell: ActionCell,
  }),
];

export { createColumns };
