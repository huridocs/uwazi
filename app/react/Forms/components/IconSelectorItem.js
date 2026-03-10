import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon, CountryList } from 'UI';
import { Translate } from 'app/I18N';

const style = { display: 'inline-block', width: '25px' };

export default class IconSelectorItem extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.item._id !== nextProps.item._id;
  }

  render() {
    const { item } = this.props;

    let icon = <Translate>No icon / flag</Translate>;
    if (item.type === 'Icons') {
      icon = (
        <span style={style}>
          <Icon icon={`${item._id}`} />
        </span>
      );
    }

    if (item.type === 'Flags') {
      const className = `fi fi-${CountryList.get(item._id).cca2}`.toLowerCase();
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

IconSelectorItem.defaultProps = {
  item: undefined,
};

IconSelectorItem.propTypes = {
  item: PropTypes.instanceOf(Object),
};
