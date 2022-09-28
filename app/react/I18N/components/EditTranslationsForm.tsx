import React, { useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { useForm } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { IStore } from 'app/istore';
import { BackButton } from 'app/Layout';
import { Icon, ToggleButton } from 'app/UI';
import { actions, Translate, I18NLink, t } from 'app/I18N';
import { SelectFileButton } from 'app/App/SelectFileButton';
import {
  prepareFormValues,
  prepareTranslationsToSave,
  formDataType,
} from '../actions/translationsFormActions';

const importButton = (action: () => any) => (
  <SelectFileButton onFileImported={action}>
    <button type="button" className="btn btn-default import-template">
      <Icon icon="upload" />
      <span className="btn-label">
        <Translate>Import</Translate>
      </span>
    </button>
  </SelectFileButton>
);

const mapStateToProps = (state: IStore) => ({
  translations: state.translations,
});

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      saveTranslations: actions.saveTranslations,
      importTranslations: actions.importTranslations,
    },
    dispatch
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & { context: string };

const EditTranslationsFormComponent = ({
  context,
  translations,
  saveTranslations,
  importTranslations,
}: mappedProps) => {
  const [showUntranslatedOnly, setShowUntranslatedOnly] = useState(false);

  const { contextLabel, formData, contextTranslations } = prepareFormValues(translations, context);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { formData },
    mode: 'onSubmit',
  });

  const submit = (values: { formData: formDataType[] }) => {
    const translationsToSave = prepareTranslationsToSave(contextTranslations, values.formData);
    saveTranslations(translationsToSave);
  };

  return (
    <div className="EditTranslationForm">
      <form onSubmit={handleSubmit(submit)}>
        <div className="panel panel-default">
          <div className="panel-heading">
            <div className="context">
              <Translate>Translations</Translate>
              <Icon icon="angle-right" />
              <span>{contextLabel}</span>
            </div>
            <div className="translation-filter">
              <Translate>Untranslated Terms</Translate>
              <ToggleButton
                checked={showUntranslatedOnly}
                onClick={() => setShowUntranslatedOnly(!showUntranslatedOnly)}
              />
            </div>
          </div>

          <ul className="list-group">
            {formData.map((data, dataIndex) => (
              <li
                key={data.key}
                className={
                  showUntranslatedOnly && !data.hasUntranslatedValues
                    ? 'list-group-item hidden'
                    : 'list-group-item'
                }
              >
                <h5>{data.key}</h5>
                {data.values.map((value: { locale: string; value: string }, valueIndex: number) => (
                  <div key={value.locale} className="form-group">
                    <div className="input-group">
                      <span className="input-group-addon">{value.locale}</span>
                      <input
                        className="form-control"
                        type="text"
                        {...register(`formData.${dataIndex}.values.${valueIndex}.value`, {
                          required: true,
                        })}
                      />
                    </div>
                    <ErrorMessage
                      errors={errors}
                      name={`formData.${dataIndex}.values.${valueIndex}.value`}
                      render={() => (
                        <p className="error" role="alert">
                          {t('System', 'This field is required')}
                        </p>
                      )}
                    />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>

        <div className="settings-footer">
          <div className="btn-cluster">
            <BackButton to="/settings/translations" className="btn-plain" />
            {context === 'System' && importButton(importTranslations)}
          </div>
          <div className="btn-cluster content-right">
            <I18NLink to="/settings/translations" className="btn btn-extra-padding btn-default">
              <span className="btn-label">
                <Translate>Cancel</Translate>
              </span>
            </I18NLink>
            <button type="submit" className="btn btn-extra-padding btn-success save-template">
              <span className="btn-label">
                <Translate>Save</Translate>
              </span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
const container = connector(EditTranslationsFormComponent);
export { container as EditTranslationsForm };
