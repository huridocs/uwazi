import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {getField} from 'react-redux-form';

export class FormGroup extends Component {

  render() {
    let className = 'form-group';
    if (this.props.hasError) {
      className += ' has-error';
    }

    return (
      <div className={className}>
        {this.props.children}
      </div>
    );
  }

}

let childrenType = PropTypes.oneOfType([
  PropTypes.object,
  PropTypes.array
]);

FormGroup.propTypes = {
  hasError: PropTypes.bool,
  children: childrenType
};

export const mapStateToProps = (state, props) => {
  if (props.field === 'title' || props.field === 'metadata.requerido') {
    const fieldSatate = getField(state, props.model + '.' + props.field);
    const touched = !fieldSatate.pristine || fieldSatate.$form && !fieldSatate.$form.pristine;
    const invalid = fieldSatate.valid === false || !!fieldSatate.$form && fieldSatate.$form.valid === false;
    return {hasError: (touched || fieldSatate.submitFailed) && invalid};
  }
  return {hasError: false};
};

export default connect(mapStateToProps)(FormGroup);
