import React from 'react';
import { Icon } from 'UI';
import { PropertySchema } from 'shared/types/commonTypes';
import { TableViewColumn } from 'app/istore';
import { Translate } from 'app/I18N';

export interface SelectableColumn extends TableViewColumn {
  indeterminate?: boolean;
  selectAll: boolean;
}

const updateIndeterminate = (item: SelectableColumn) => (elem: HTMLInputElement) => {
  if (item.selectAll && elem && item.indeterminate !== undefined) {
    // eslint-disable-next-line no-param-reassign
    elem.indeterminate = item.indeterminate;
  }
};

export const ColumnItem = ({ item }: { item: SelectableColumn }) => (
  <React.Fragment>
    <input ref={updateIndeterminate(item)} type="checkbox" checked={!item.hidden} />
    <Translate>{item.label}</Translate>
  </React.Fragment>
);

export const ValueItem = (hiddenColumns: PropertySchema[]) => () => (
  <span>
    <Icon icon="bars" rotation={90} />
    {hiddenColumns.length ? `${hiddenColumns.length} ` : ''}
    <Translate>{hiddenColumns.length ? 'columns hidden' : 'Hide columns'}</Translate>
  </span>
);
