import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Control} from 'react-redux-form';

const mapProps = {
  className: ({fieldValue}) => {
    let _fieldValue = fieldValue.$form || fieldValue;
    return (!_fieldValue.pristine || _fieldValue.submitFailed) && !_fieldValue.valid
    ? 'has-error'
    : '';
  }
};

export class FormGroup extends Component {
  render() {
    if (this.props.model) {
      let className = `form-group ${this.props.className || ''}`;
      return (
        <Control.custom model={this.props.model}
          component={(props) => <div className={`${className} ${props.className}`}>{props.children}</div>}
          mapProps={mapProps}
        >
        {this.props.children}
        </Control.custom>
      );
    }

    return <div className={'form-group ' + this.props.className}>{this.props.children}</div>;
  }
}

let childrenType = PropTypes.oneOfType([
  PropTypes.object,
  PropTypes.array
]);

FormGroup.propTypes = {
  hasError: PropTypes.bool,
  className: PropTypes.string,
  model: PropTypes.any,
  children: childrenType
};

export default connect()(FormGroup);
