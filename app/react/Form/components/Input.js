import React, {Component, PropTypes} from 'react';

export class Input extends Component {

  render() {
    const {properties, label} = this.props;
    let className = 'form-group';
    if (properties.touched && properties.error) {
      className += ' has-error';
    }
    return (
      <div className={className}>
        <label>{label}</label>
        <input className="form-control" {...properties}/>
      </div>
    );
  }

}

Input.propTypes = {
  properties: PropTypes.object,
  label: PropTypes.string
};

export default Input;
