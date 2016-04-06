import React, {Component, PropTypes} from 'react';

export class Textarea extends Component {

  render() {
    const {properties, label} = this.props;
    return (
      <div className="form-group">
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
