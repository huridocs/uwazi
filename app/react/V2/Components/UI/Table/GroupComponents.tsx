/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Row } from '@tanstack/react-table';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';

import { Translate } from '#app/I18N/index.js';
import { EmbededButton } from '#V2/Components/UI/EmbededButton.js';
import { TableRow } from '#V2/Components/UI/Table/Table.js';

const GroupHeader = () => <Translate className="sr-only">Empty</Translate>;

const GroupCell = <T extends TableRow<T>>({ row }: { row: Row<T> }) => {
  const canExpand = row.originalSubRows;
  const expanded = row.getIsExpanded();

  return canExpand ? (
    <EmbededButton
      icon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      onClick={() => row.toggleExpanded()}
      color="indigo"
      className={`${expanded ? 'bg-primary-300' : 'bg-primary-100'} rounded-md border-none drop-shadow-none`}
    >
      <Translate className={`${expanded ? 'text-indigo-800' : 'text-indigo-700'}`}>Group</Translate>
      <Translate className="sr-only">Open group</Translate>
    </EmbededButton>
  ) : null;
};

export { GroupCell, GroupHeader };
