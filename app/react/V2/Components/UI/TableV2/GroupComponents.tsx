/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Row } from '@tanstack/react-table';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { Translate, t } from 'app/I18N';
import { EmbededButton } from '../EmbededButton';
import { RowWithId } from './Table';

const GroupHeader = () => <Translate className="sr-only">Empty</Translate>;

const GroupCell = <T extends RowWithId<T>>({ row }: { row: Row<T> }) => {
  const canExpand = row.originalSubRows;
  const expanded = row.getIsExpanded();

  return canExpand ? (
    <EmbededButton
      icon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      onClick={() => row.toggleExpanded()}
      color="indigo"
      className="bg-indigo-200 rounded-md border-none drop-shadow-none"
    >
      <span className="sr-only">{`${t('System', 'Open group', null, false)} ${`${row.index + 1}`}`}</span>
      <Translate>Group</Translate>
    </EmbededButton>
  ) : null;
};

export { GroupCell, GroupHeader };
