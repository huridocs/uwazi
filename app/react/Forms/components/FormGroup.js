import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

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

export const mapStateToProps = ({}, props) => {
  const touched = !props.pristine || props.$form && !props.$form.pristine;
  const invalid = props.valid === false || !!props.$form && props.$form.valid === false;
  return {hasError: (touched || props.submitFailed) && invalid};
};

export default connect(mapStateToProps)(FormGroup);
