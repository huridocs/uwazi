import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'UI';
import { PropertySchema } from 'shared/types/commonTypes';
import { TableViewColumn } from 'app/istore';

export interface SelectableColumn extends TableViewColumn {
  indeterminate?: boolean;
  selectAll: boolean;
}

function updateIndeterminate(item: SelectableColumn) {
  return (elem: HTMLInputElement) => {
    // eslint-disable-next-line no-param-reassign
    if (item.selectAll && elem && item.indeterminate) {
      elem.indeterminate = item.indeterminate;
    }
  };
}

export const ColumnItem = ({ item }: { item: SelectableColumn }) => (
  <React.Fragment>
    <input
      ref={updateIndeterminate(item)}
      type="checkbox"
      checked={!item.hidden}
    />
    {item.label}
  </React.Fragment>
);

export const ValueItem = (hiddenColumns: PropertySchema[]) => () => (
  <span>
    <Icon icon="bars" rotation={90} />
    {hiddenColumns.length ? `${hiddenColumns.length} columns hidden` : 'Hide columns'}
  </span>
);

ColumnItem.propTypes = {
  item: PropTypes.object.isRequired,
};
