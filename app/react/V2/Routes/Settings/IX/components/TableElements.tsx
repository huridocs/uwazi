/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { IXExtractorInfo } from '../types';

const columnHelper = createColumnHelper<IXExtractorInfo>();

const ExtractorHeader = () => <Translate>Extractor</Translate>;
const PropertyHeader = () => <Translate>Property</Translate>;
const TemplatesHeader = () => <Translate>Templates</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;

const ActionButton = ({ cell }: CellContext<IXExtractorInfo, any>) => (
  <Button>
    <Link to="#">
      <Translate>Review</Translate>
    </Link>
  </Button>
);

const tableColumns = [
  columnHelper.accessor('name', {
    header: ExtractorHeader,
    // cell: UsernameCell,
    meta: { className: '' },
  }),
  columnHelper.accessor('property', {
    header: PropertyHeader,
    // cell: UsernameCell,
    meta: { className: '' },
  }),
  columnHelper.accessor('templates', {
    header: TemplatesHeader,
    // cell: UsernameCell,
    meta: { className: '' },
  }),
  columnHelper.display({
    id: 'action-column',
    header: ActionHeader,
    cell: ActionButton,
    meta: { className: 'w-0 text-center' },
    enableSorting: false,
  }),
];

export { tableColumns };
