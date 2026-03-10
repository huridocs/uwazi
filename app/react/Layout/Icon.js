import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Icon as UIIcon, CountryList } from 'UI';

function getFaSize(size) {
  switch (size) {
    case 'xs':
      return 'sm';
    case 'sm':
      return 'lg';
    case 'md':
      return '2x';
    case 'lg':
      return '2x';
    case 'xlg':
      return '2x';
    default:
      return 'sm';
  }
}

export class Icon extends Component {
  getJSData() {
    const { data } = this.props;
    let _data = data;

    if (data && _data.toJS) {
      _data = _data.toJS();
    }

    return _data;
  }

  getIcon(_data) {
    const { className, size } = this.props;
    let icon;

    if (_data.type === 'Icons') {
      icon = <UIIcon icon={`${_data._id}`} size={`${getFaSize(size)}`} />;
    }

    if (_data.type === 'Flags') {
      const flagClassName = `fi fi-${CountryList.get(_data._id).cca2}`.toLowerCase();
      const componentClassName = `${className} ${flagClassName}`;
      icon = <span className={componentClassName} />;
    }

    return icon;
  }

  render() {
    const { className } = this.props;
    let html = null;
    const _data = this.getJSData();

    if (_data && _data._id) {
      const icon = this.getIcon(_data);
      html = <span className={className}>{icon}</span>;
    }

    return html;
  }
}

Icon.defaultProps = {
  data: undefined,
  className: undefined,
  size: undefined,
};

Icon.propTypes = {
  data: PropTypes.instanceOf(Object),
  className: PropTypes.string,
  size: PropTypes.string,
};

export default connect()(Icon);
