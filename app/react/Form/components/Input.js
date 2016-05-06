import React, {Component, PropTypes} from 'react';

export class Input extends Component {

  render() {
    const {properties, label} = this.props;
    let className = 'form-group';
    if (properties.touched && properties.error) {
      className += ' has-error';
    }
    return (
      <ul className="search__filter">
        <li><span>{label}</span></li>
        <li className="wide"><input className="form-control" {...properties}/></li>
      </ul>
    );
  }

}

Input.propTypes = {
  properties: PropTypes.object,
  label: PropTypes.string
};

export default Input;
