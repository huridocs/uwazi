import React, { useEffect, useState } from 'react';
import { Field } from 'react-redux-form';
import { connect, ConnectedProps } from 'react-redux';
import { orderBy } from 'lodash';
import { Select } from 'app/ReactReduxForms';
import { Translate, t } from 'app/I18N';
import { Warning } from 'app/Layout';
import { IStore } from 'app/istore';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import PropertyConfigOptions from './PropertyConfigOptions';
import { checkErrorsOnLabel } from '../utils/checkErrorsOnLabel';

type formConfigSelectComponentProps = {
  index: number;
  type: string;
};

const mapStateToProps = (state: IStore, ownProps: formConfigSelectComponentProps) => {
  const { template, thesauris } = state;
  const property = template.data.properties ? template.data.properties[ownProps.index] : undefined;
  return {
    labelHasError: checkErrorsOnLabel(state, ownProps),
    contentRequiredError:
      //@ts-ignore
      template.formState.$form.errors[`properties.${ownProps.index}.content.required`],
    templateId: template.data._id,
    thesauris,
    property,
    content: property?.content,
    index: ownProps.index,
    type: ownProps.type,
  };
};

const connector = connect(mapStateToProps);

type mappedProps = ConnectedProps<typeof connector>;

const FormConfigSelectComponent = ({
  index,
  type,
  labelHasError,
  contentRequiredError,
  templateId,
  property,
  content,
  thesauris,
}: mappedProps) => {
  const [warning, setWarning] = useState(false);
  const [initialContent] = useState(content);

  useEffect(() => {
    if (initialContent !== content && property?._id) {
      setWarning(true);
    }
  }, [content]);

  const options = orderBy(
    thesauris
      .toJS()
      .filter(
        (thesaurus: ThesaurusSchema) =>
          thesaurus._id !== templateId && thesaurus.type !== 'template'
      )
      .map((thesaurus: ThesaurusSchema) => ({
        ...thesaurus,
        name: t(thesaurus._id, thesaurus.name, null, false),
      })),
    'name'
  );

  return (
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
          <select
            name="type"
            id="property-type"
            className="form-control"
            disabled={!!property?._id}
          >
            <option value="select">{t('System', 'Single select', null, false)}</option>
            <option value="multiselect">{t('System', 'Multiple select', null, false)}</option>
          </select>
        </Field>
      </div>

      <div className={contentRequiredError ? 'form-group has-error' : 'form-group'}>
        <label htmlFor="property-thesauri">
          <Translate>Thesauri</Translate>
          <span className="required">*</span>
        </label>
        {warning && (
          <Warning inline>
            <Translate translationKey="Impact of property change warning">
              By making this change, any values from the previous thesaurus already assigned to
              entities will be lost.
            </Translate>
          </Warning>
        )}
        <Select
          model={`template.data.properties[${index}].content`}
          options={options}
          optionsLabel="name"
          optionsValue="_id"
          id="property-thesauri"
        />
      </div>

      <PropertyConfigOptions index={index} type={type} />
    </div>
  );
};

const container = connector(FormConfigSelectComponent);
export { container as FormConfigSelect };
