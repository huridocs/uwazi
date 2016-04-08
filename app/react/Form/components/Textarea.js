import React, {Component, PropTypes} from 'react';

export class Textarea extends Component {

  render() {
    const {properties, label} = this.props;
    let className = 'form-group';
    if (properties.touched && properties.error) {
      className += ' has-error';
    }
    return (
      <div className={className}>
        <label>{label}</label>
        <textarea className="form-control" {...properties}/>
      </div>
    );
  }

}

Textarea.propTypes = {
  properties: PropTypes.object,
  label: PropTypes.string
};

export default Textarea;
