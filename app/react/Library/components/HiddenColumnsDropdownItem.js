import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'UI';

function updateIndeterminate(item) {
  return elem => {
    // eslint-disable-next-line no-param-reassign
    if (elem) elem.indeterminate = item.indeterminate;
  };
}

export const ColumnItem = ({ item }) => (
  <React.Fragment>
    <input
      ref={item.selectAll && updateIndeterminate(item)}
      type="checkbox"
      checked={!item.hidden}
    />
    {item.label}
  </React.Fragment>
);

export const ValueItem = hiddenColumns => () => (
  <span>
    <Icon icon="bars" rotation={90} />
    {hiddenColumns.length ? `${hiddenColumns.length} columns hidden` : 'Hide columns'}
  </span>
);

ColumnItem.propTypes = {
  item: PropTypes.object.isRequired,
};
