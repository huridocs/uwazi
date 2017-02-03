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
  return {hasError: (props.touched || props.submitFailed) && props.valid === false};
};

export default connect(mapStateToProps)(FormGroup);
