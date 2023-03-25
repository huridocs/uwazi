import React, { useState } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { useForm, UseFormReset } from 'react-hook-form';
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

const importButton = (action: any, reset: UseFormReset<any>) => {
  const handleFileSubmit = async (file: File) => {
    const updatedTranslations = await action(file);
    if (updatedTranslations) {
      const formValues = prepareFormValues(updatedTranslations, 'System');
      reset(formValues);
    }
  };

  return (
    <SelectFileButton onFileImported={handleFileSubmit} id="import-translations">
      <button type="button" className="btn btn-default import-template">
        <Icon icon="upload" />
        <span className="btn-label">
          <Translate>Import</Translate>
        </span>
      </button>
    </SelectFileButton>
  );
};

const mapStateToProps = (state: IStore) => ({
  translations: state.translations,
  defaultLocale: state.settings.collection
    .get('languages')
    ?.find(lang => lang?.get('default') === true)
    .get('key'),
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

type TranslationValue = { locale: string; value: string };

const EditTranslationsFormComponent = ({
  context,
  translations,
  saveTranslations,
  importTranslations,
  defaultLocale,
}: mappedProps) => {
  const [showUntranslatedOnly, setShowUntranslatedOnly] = useState(false);

  const { contextLabel, formData, contextTranslations } = prepareFormValues(
    translations,
    context,
    defaultLocale
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: { formData },
    mode: 'onSubmit',
  });

  const submit = (values: { formData: formDataType[] }) => {
    const translationsToSave = prepareTranslationsToSave(contextTranslations, values.formData);
    saveTranslations(translationsToSave);
  };

  const noUntranslatedTerms = !formData.find(data => data.untranslatedValues.length > 0);
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

          {Boolean(noUntranslatedTerms && showUntranslatedOnly) && (
            <div className="alert alert-info">
              <Icon icon="info-circle" size="2x" />
              <div>
                <Translate>There are no untranslated terms</Translate>
              </div>
            </div>
          )}
          {Boolean(!noUntranslatedTerms || !showUntranslatedOnly) && (
            <ul className="list-group">
              {formData.map((data, dataIndex) => {
                const isDefault = (value: { locale: string }) =>
                  (context === 'System' && value.locale === 'en') ||
                  (context !== 'System' && value.locale === defaultLocale);

                const hiddenKey = showUntranslatedOnly && !data.untranslatedValues.length;

                return (
                  <li key={data.key} className={`list-group-item ${hiddenKey ? 'hidden' : ''}`}>
                    <h5>{data.key}</h5>
                    {data.values.map((value: TranslationValue, valueIndex: number) => {
                      const isTranslated =
                        value.value !== data.key && value.value !== data.defaultTranslation;
                      const hiddenValue = hiddenKey || (showUntranslatedOnly && isTranslated);
                      const isDefaultValue = isDefault(value);
                      return (
                        <div
                          key={value.locale}
                          className={`form-group ${hiddenValue ? 'hidden' : ''} ${
                            isDefaultValue ? ' default' : ''
                          } ${!isTranslated && !isDefaultValue ? ' untranslated' : ''}`}
                        >
                          <div className="input-group">
                            <span className="input-group-addon">{value.locale}</span>
                            <textarea
                              className="form-control"
                              rows={1}
                              // eslint-disable-next-line react/jsx-props-no-spreading
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
                      );
                    })}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="settings-footer">
          <div className="btn-cluster">
            <BackButton to="/settings/translations" className="btn-plain" />
            {context === 'System' && importButton(importTranslations, reset)}
          </div>
          <div className="btn-cluster content-right">
            <I18NLink to="/settings/translations" className="btn btn-extra-padding btn-default">
              <span className="btn-label">
                <Translate>Cancel</Translate>
              </span>
            </I18NLink>
            <button
              type="submit"
              className="btn btn-extra-padding btn-success save-template"
              disabled={noUntranslatedTerms && showUntranslatedOnly}
            >
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
