import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import Flag from 'react-flags';

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
    return '';
  case 'sm':
    return 'fa-lg';
  case 'md':
    return 'fa-2x';
  case 'lg':
    return 'fa-2x';
  case 'xlg':
    return 'fa-2x';
  default:
    return '';
  }
}

export class Icon extends Component {
  render() {
    const {data, className, size} = this.props;
    let html = null;
    let _data = data;

    if (data && _data.toJS) {
      _data = _data.toJS();
    }

    if (_data && _data._id) {
      let icon;

      if (_data.type === 'Icons') {
        icon = <i className={`fa fa-${_data._id} ${getFaSize(size)}`}></i>;
      }

      if (_data.type === 'Flags') {
        icon = <Flag name={_data._id}
                     format="png"
                     pngSize={getPngSize(size)}
                     shiny={true}
                     alt={`${_data.label} flag`}
                     basePath="/flag-images" />;
      }

      html = <span className={className}>{icon}</span>;
    }

    return html;
  }
}

Icon.propTypes = {
  data: PropTypes.object,
  className: PropTypes.string,
  size: PropTypes.string
};

export default connect()(Icon);

