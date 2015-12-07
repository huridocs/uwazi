import React, { Component, PropTypes } from 'react'
import FieldMap from './FieldMap.js';

class Field extends Component {

  render = () => {
    let fieldType = FieldMap[this.props.config.type];
    return React.createElement(fieldType, this.props.config);
  }

}
export default Field;
