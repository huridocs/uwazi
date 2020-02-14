import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Flag from 'react-flags';
import { Icon as UIIcon } from 'UI';

function getPngSize(size) {
  switch (size) {
    case 'xs':
      return 16;
    case 'sm':
      return 24;
    case 'md':
      return 32;
    case 'lg':
      return 48;
    case 'xlg':
      return 64;
    default:
      return 16;
  }
}

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
  render() {
    const { data, className, size } = this.props;
    let html = null;
    let _data = data;

    if (data && _data.toJS) {
      _data = _data.toJS();
    }

    if (_data && _data._id) {
      let icon;

      if (_data.type === 'Icons') {
        icon = <UIIcon icon={`${_data._id}`} size={`${getFaSize(size)}`} />;
      }

      if (_data.type === 'Flags') {
        icon = (
          <Flag
            name={_data._id}
            format="png"
            pngSize={getPngSize(size)}
            shiny
            alt={`${_data.label} flag`}
            basePath="/flag-images"
          />
        );
      }

      html = <span className={className}>{icon}</span>;
    }

    return html;
  }
}

Icon.propTypes = {
  data: PropTypes.object,
  className: PropTypes.string,
  size: PropTypes.string,
};

export default connect()(Icon);
