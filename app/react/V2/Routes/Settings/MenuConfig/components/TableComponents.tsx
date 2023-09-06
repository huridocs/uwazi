/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Translate } from 'app/I18N';
import { Button } from 'V2/Components/UI/Button';
import { CellContext } from '@tanstack/react-table';
import { LinkSchema } from 'shared/types/commonTypes';

const EditButton = ({ cell, column }: CellContext<LinkSchema, string>) => (
  <Button
    styling="outline"
    onClick={() => column.columnDef.meta?.action?.(cell.row)}
    className="leading-4"
  >
    <Translate>Edit</Translate>
  </Button>
);

const TitleCell = ({ cell, row, table, getValue }: CellContext<LinkSchema, string>) => {
  console.log('cell', cell);
  console.log('row', row, row.getCanExpand());
  console.log('table', table, table.setExpanded);
  return (
    <div className="flex items-center gap-2">
      <Translate context="Menu">{getValue()}</Translate>
      {row.getCanExpand() && (
        <Button onClick={() => row.toggleExpanded()} size="small">
          Group
        </Button>
      )}
    </div>
  );
};

const TitleHeader = () => <Translate>Label</Translate>;
const URLHeader = () => <Translate>URL</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;
export { EditButton, TitleHeader, URLHeader, ActionHeader, TitleCell };
