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
      <label>
        <Translate>Name</Translate>
      </label>
      <Field model={`template.data.properties[${index}].label`}>
        <input className="form-control" />
      </Field>
    </div>

    <div className="form-group">
      <label htmlFor="property-type">
        <Translate>Property type</Translate>
      </label>
      &nbsp;(<Translate>This cannot be changed after saving</Translate>)
      <Field model={`template.data.properties[${index}].type`}>
        <select name="type" id="property-type" className="form-control" disabled={!!property?._id}>
          <option value="date">{t('System', 'property date', 'Date', false)}</option>
          <option value="multidate">
            {t('System', 'property multidate', 'Multi Date', false)}
          </option>
          <option value="daterange">
            {t('System', 'property daterange', 'Date Range', false)}
          </option>
          <option value="multidaterange">
            {t('System', 'property multidaterange', 'Multi Date Range', false)}
          </option>
        </select>
      </Field>
    </div>

    <PropertyConfigOptions index={index} type={type} canBeFilter />
  </div>
);

const container = connector(FormConfigDateComponent);
export { container as FormConfigDate };
