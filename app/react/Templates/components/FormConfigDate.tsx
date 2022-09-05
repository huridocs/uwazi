import React from 'react';
import { Field } from 'react-redux-form';
import { connect, ConnectedProps } from 'react-redux';
import { t, Translate } from 'app/I18N';
import { IStore } from 'app/istore';
import { checkErrorsOnLabel } from '../utils/checkErrorsOnLabel';
import PropertyConfigOptions from './PropertyConfigOptions';

type formConfigDateComponentProps = {
  index: number;
  type: string;
};

const mapStateToProps = (state: IStore, ownProps: formConfigDateComponentProps) => {
  const { template } = state;
  return {
    property: template.data.properties ? template.data.properties[ownProps.index] : undefined,
    index: ownProps.index,
    type: ownProps.type,
    labelHasError: checkErrorsOnLabel(state, ownProps),
  };
};

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;

const FormConfigDateComponent = ({ index, type, labelHasError, property }: mappedProps) => (
  <div>
    <div className={`form-group${labelHasError ? ' has-error' : ''}`}>
      <label htmlFor="property-label">
        <Translate>Label</Translate>
      </label>
      <Field model={`template.data.properties[${index}].label`}>
        <input className="form-control" id="property-label" />
      </Field>
    </div>

    <div className="form-group">
      <label htmlFor="property-type">
        <Translate>Type</Translate>
      </label>
      <span className="property-type-warning">
        <Translate>This cannot be changed after saving</Translate>
      </span>
      <Field model={`template.data.properties[${index}].type`}>
        <select name="type" id="property-type" className="form-control" disabled={!!property?._id}>
          <option value="date">{t('System', 'Single date', null, false)}</option>
          <option value="multidate">{t('System', 'Multiple date', null, false)}</option>
          <option value="daterange">{t('System', 'Single date range', null, false)}</option>
          <option value="multidaterange">{t('System', 'Multiple date range', null, false)}</option>
        </select>
      </Field>
    </div>

    <PropertyConfigOptions index={index} type={type} canBeFilter />
  </div>
);

const container = connector(FormConfigDateComponent);
export { container as FormConfigDate };
