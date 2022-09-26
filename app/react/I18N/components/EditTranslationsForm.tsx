/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { useForm } from 'react-hook-form';
import { IImmutable } from 'shared/types/Immutable';
import { generateID } from 'shared/IDGenerator';
import { ClientTranslationSchema, IStore } from 'app/istore';
import { BackButton } from 'app/Layout';
import { Icon } from 'app/UI';
import { actions, Translate, I18NLink } from 'app/I18N';
import { SelectFileButton } from 'app/App/SelectFileButton';

const prepareFormValues = (
  translations: IImmutable<ClientTranslationSchema[]>,
  context: string
) => {
  const translationsByLanguage = translations.toJS().map((translation: ClientTranslationSchema) => {
    const valuesForLanguage = translation.contexts?.filter(
      translationContext => translationContext?.id === context
    );
    return { ...translation, contexts: valuesForLanguage };
  });

  const contextTerms = Object.keys(translationsByLanguage[0].contexts[0].values).sort();

  const contextValues = translationsByLanguage.map((byLang: ClientTranslationSchema) => ({
    locale: byLang.locale,
    ...byLang?.contexts?.[0].values,
  }));

  const formValues = contextTerms.map(contextTerm => ({
    key: contextTerm,
    formID: generateID(6, 6),
    values: contextValues.map((val: { [x: string]: any; locale: any }) => ({
      locale: val.locale,
      value: val[contextTerm],
    })),
  }));

  return {
    contextLabel: translationsByLanguage[0].contexts[0].label,
    formValues,
  };
};

const prepareTranslationsToSave = (
  currentTranslations: IImmutable<ClientTranslationSchema[]>,
  formData
) => {
  console.log(currentTranslations.toJS());
  console.log(formData);
};

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
  const { contextLabel, formValues } = prepareFormValues(translations, context);

  const { register, handleSubmit } = useForm({
    defaultValues: { values: formValues },
    mode: 'onSubmit',
  });

  const submit = values => {
    const translationsToSave = prepareTranslationsToSave(translations, values);
    // saveTranslations(values.formValues);
  };

  return (
    <div className="EditTranslationForm">
      <form onSubmit={handleSubmit(submit)}>
        <div className="panel panel-default">
          <div className="panel-heading">
            <Translate>Translations</Translate> <Icon icon="angle-right" /> {contextLabel}
          </div>

          <ul className="list-group">
            {formValues.map((formValue, index) => (
              <li key={formValue.key} className="list-group-item">
                <h5>{formValue.key}</h5>
                {formValue.values.map((value, index2: number) => (
                  <div className="form-group" key={value.locale}>
                    <div className="input-group">
                      <span className="input-group-addon">{value.locale}</span>
                      <input
                        className="form-control"
                        type="text"
                        {...register(`values.${index}.values.${index2}.value`)}
                      />
                    </div>
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
