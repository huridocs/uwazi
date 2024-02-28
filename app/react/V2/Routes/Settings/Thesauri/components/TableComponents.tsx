import React from 'react';
import { CellContext } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { Button, EmbededButton } from 'app/V2/Components/UI';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import ChevronUpIcon from '@heroicons/react/20/solid/ChevronUpIcon';
import ChevronDownIcon from '@heroicons/react/20/solid/ChevronDownIcon';

const ThesaurusLabel = ({ cell }: any) => (
  <div className="flex items-center ">
    <span className="text-indigo-700">{cell.row.original.name}</span>
    &nbsp;
    {'('}
    <Translate context={cell.row.original._id}>{cell.row.original.name}</Translate>
    {')'}
  </div>
);

const ActionHeader = () => <Translate>Action</Translate>;

const ThesaurusValueLabel = ({ row, getValue }: CellContext<ThesaurusValueSchema, string>) => (
  <div className="flex items-center gap-2">
    <Translate
      context="Menu"
      className={row.getIsExpanded() ? 'text-indigo-700' : 'text-indigo-700'}
    >
      {getValue()}
    </Translate>
    {row.getCanExpand() && (
      <EmbededButton
        icon={row.getIsExpanded() ? <ChevronUpIcon /> : <ChevronDownIcon />}
        onClick={() => row.toggleExpanded()}
        color="indigo"
        className="bg-indigo-200 border-none rounded-md drop-shadow-none"
      >
        <Translate>Group</Translate>
      </EmbededButton>
    )}
  </div>
);

const LabelHeader = () => <Translate>Language</Translate>;

const EditButton = ({ cell, column }: CellContext<ThesaurusSchema, string>) => (
  <Button
    styling="action"
    onClick={() => column.columnDef.meta?.action?.(cell.row)}
    className="leading-4"
  >
    <Translate>Edit</Translate>
  </Button>
);

export { ThesaurusLabel, LabelHeader, EditButton, ThesaurusValueLabel, ActionHeader };
