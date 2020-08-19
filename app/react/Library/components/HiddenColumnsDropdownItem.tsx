import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'UI';
import { PropertySchema } from '../../../shared/types/commonTypes';

function updateIndeterminate(item: PropertySchema) {
  return (elem: HTMLInputElement) => {
    // eslint-disable-next-line no-param-reassign
    if (elem) elem.indeterminate = item.indeterminate;
  };
}

export const ColumnItem = ({ item }: { item: PropertySchema }) => (
  <React.Fragment>
    <input
      ref={item.selectAll && updateIndeterminate(item)}
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
