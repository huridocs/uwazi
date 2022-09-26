/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { useForm } from 'react-hook-form';
import { IImmutable } from 'shared/types/Immutable';
import { ClientTranslationSchema, IStore } from 'app/istore';
import { BackButton } from 'app/Layout';
import { Icon } from 'app/UI';
import { actions, Translate, I18NLink } from 'app/I18N';
import { SelectFileButton } from 'app/App/SelectFileButton';

const prepateTranslations = (
  translations: IImmutable<ClientTranslationSchema[]>,
  context: string
): ClientTranslationSchema[] => {
  const preparedTranslations = translations.toJS().map((translation: ClientTranslationSchema) => {
    const translationsForContext = translation.contexts?.filter(
      translationContext => translationContext?.id === context
    );
    return { ...translation, contexts: translationsForContext };
  });
  return preparedTranslations;
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
  const preparedTranslations = prepateTranslations(translations, context);
  const contextLabel = preparedTranslations?.[0].contexts?.[0].label;
  const contextTerms = Object.keys(preparedTranslations?.[0].contexts?.[0].values || {});

  const { register, handleSubmit } = useForm({
    defaultValues: { formValues: preparedTranslations },
    mode: 'onSubmit',
  });

  const submit = (values: { formValues: ClientTranslationSchema[] }) =>
    saveTranslations(values.formValues);

  return (
    <div className="EditTranslationForm">
      <form onSubmit={handleSubmit(submit)}>
        <div className="panel panel-default">
          <div className="panel-heading">
            <Translate>Translations</Translate> <Icon icon="angle-right" /> {contextLabel}
          </div>

          <ul className="list-group">
            {contextTerms.sort().map(term => (
              <li key={term} className="list-group-item">
                <h5>{term}</h5>
                {preparedTranslations.map((translation: ClientTranslationSchema, index: number) => (
                  <div className="form-group" key={translation.locale}>
                    <div className="input-group">
                      <span className="input-group-addon">{translation.locale}</span>
                      <input
                        className="form-control"
                        type="text"
                        {...register(`formValues.${index}.contexts.0.values.${term}`)}
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
