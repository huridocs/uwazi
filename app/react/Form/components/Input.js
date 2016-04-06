import React, {Component, PropTypes} from 'react';

export class Input extends Component {

  render() {
    const {properties, label} = this.props;
    return (
      <div className="form-group">
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
