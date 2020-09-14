import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Icon } from 'UI';

const style = { display: 'inline-block', width: '25px' };

export default class ListItem extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.item._id !== nextProps.item._id;
  }

  render() {
    const { item } = this.props;

    let icon = <span>No icon / flag</span>;
    if (item.type === 'Icons') {
      icon = (
        <span style={style}>
          <Icon icon={`${item._id}`} />
        </span>
      );
    }

    if (item.type === 'Flags') {
      const className = `flag-icon flag-icon-${item._id}`.toLowerCase();
      icon = (
        <span style={style}>
          <span className={className} />
        </span>
      );
    }

    return (
      <span>
        {icon}
        {item.label}
      </span>
    );
  }
}

ListItem.defaultProps = {
  item: undefined,
};

ListItem.propTypes = {
  item: PropTypes.instanceOf(Object),
};
