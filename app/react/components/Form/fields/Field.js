import React, { Component, PropTypes } from 'react'
import FieldMap from './FieldMap.js';

class Field extends Component {

  value = () => {
    return this.field.value();
  }

  render = () => {
    let fieldType = FieldMap[this.props.config.type];
    this.props.config.ref = (field) => {
      this.field = field;
    }

    return React.createElement(fieldType, this.props.config);
  }

}
export default Field;
