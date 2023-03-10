import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import { actions } from 'app/BasicReducer';
import { Icon } from 'app/UI';
import { Translate } from 'app/I18N';
import { store } from 'app/store';
import { checkErrorsOnLabel } from '../utils/checkErrorsOnLabel';

import PropertyConfigOptions from './PropertyConfigOptions';

const saveQuery = (value, index, template) => {
  //  model={`template.data.properties[${index}].query`}
  try {
    const query = JSON.parse(value);
    const newProperty = { ...template.data.properties[index], query };
    const newProperties = [...template.data.properties];
    newProperties[index] = newProperty;
    const newData = { ...template.data, properties: newProperties };
    store.dispatch(actions.setIn('template', 'data', newData));
  } catch (e) {
    console.log(e)
  }
};

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
        {type === 'newRelationship' && (
          <>
            <br />
            <div no-translate>
              <b>This is a new relationship!</b>
              <br />
              Denormalized property:
              <Field model={`template.data.properties[${index}].denormalizedProperty`}>
                <input className="form-control" />
              </Field>
              <br />
              Current Query: <br />
              <pre>{JSON.stringify(this.props.template.data.properties[index].query, null, 2)}</pre>
              Edit Query: <br />
              <textarea
                style={{ width: '100%', height: '100px' }}
                onChange={e => saveQuery(e.target.value, index, this.props.template)}
              />
            </div>
          </>
        )}
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
  // relationship v2:
  query: PropTypes.array,
  denormalizedProperty: PropTypes.string,
  template: PropTypes.object,
};

export function mapStateToProps(state, props) {
  return {
    labelHasError: checkErrorsOnLabel(state, props),
    // relationship v2:
    template: state.template,
  };
}

export default connect(mapStateToProps)(FormConfigInput);
