/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Row } from '@tanstack/react-table';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
import { EmbededButton } from '../EmbededButton';
import { TableRow } from './Table';

const GroupHeader = () => <Translate className="sr-only">Empty</Translate>;

const GroupCell = <T extends TableRow<T>>({ row }: { row: Row<T> }) => {
  const canExpand = row.originalSubRows;
  const expanded = row.getIsExpanded();

  return canExpand ? (
    <EmbededButton
      icon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      onClick={() => row.toggleExpanded()}
      color="indigo"
      className={`${expanded ? 'bg-indigo-300' : 'bg-indigo-100'} rounded-md border-none drop-shadow-none`}
    >
      <Translate className={`${expanded ? 'text-indigo-800' : 'text-indigo-700'}`}>Group</Translate>
      <Translate className="sr-only">Open group</Translate>
    </EmbededButton>
  ) : null;
};

export { GroupCell, GroupHeader };
