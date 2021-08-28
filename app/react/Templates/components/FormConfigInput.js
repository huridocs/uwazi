import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import { Icon } from 'app/UI';
import { Translate } from 'app/I18N';
import { checkErrorsOnLabel } from '../utils/checkErrorsOnLabel';

import PropertyConfigOptions from './PropertyConfigOptions';

export class FormConfigInput extends Component {
  render() {
    const { index, labelHasError, type, canBeFilter } = this.props;

    return (
      <div>
        <div className={`form-group${labelHasError ? ' has-error' : ''}`}>
          <label>
            <Translate>Name</Translate>
          </label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control" />
          </Field>
        </div>
        {type === 'geolocation' && (
          <div className="geolocation-grouping-alert">
            <Icon icon="info-circle" />
            <p>
              <Translate>Adjacent geolocation properties will render on the same map</Translate>.
            </p>
          </div>
        )}
        <PropertyConfigOptions index={index} type={type} canBeFilter={canBeFilter} />
      </div>
    );
  }
}

FormConfigInput.defaultProps = {
  canBeFilter: true,
  labelHasError: false,
};

FormConfigInput.propTypes = {
  canBeFilter: PropTypes.bool,
  index: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  labelHasError: PropTypes.bool,
};

export function mapStateToProps(state, props) {
  return {
    labelHasError: checkErrorsOnLabel(state, props),
  };
}

export default connect(mapStateToProps)(FormConfigInput);
