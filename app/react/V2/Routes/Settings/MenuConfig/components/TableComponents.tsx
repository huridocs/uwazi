/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Translate } from 'app/I18N';
import { CellContext } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { LinkSchema } from 'shared/types/commonTypes';
import { EmbededButton, Button } from 'app/V2/Components/UI';

const EditButton = ({ cell, column }: CellContext<LinkSchema, string>) => (
  <Button
    styling="outline"
    onClick={() => column.columnDef.meta?.action?.(cell.row)}
    className="leading-4"
  >
    <Translate>Edit</Translate>
  </Button>
);

const TitleCell = ({ row, getValue }: CellContext<LinkSchema, string>) => (
  <div className="flex items-center gap-2">
    <Translate
      context="Menu"
      className={row.getIsExpanded() ? 'text-indigo-900' : 'text-indigo-800'}
    >
      {getValue()}
    </Translate>
    {row.getCanExpand() && (
      <EmbededButton
        icon={row.getIsExpanded() ? <ChevronUpIcon /> : <ChevronDownIcon />}
        onClick={() => row.toggleExpanded()}
        color="indigo"
      >
        <Translate>Group</Translate>
      </EmbededButton>
    )}
  </div>
);

const TitleHeader = () => <Translate>Label</Translate>;
const URLHeader = () => <Translate>URL</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;
export { EditButton, TitleHeader, URLHeader, ActionHeader, TitleCell };
