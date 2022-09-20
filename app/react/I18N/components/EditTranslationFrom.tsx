import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { IImmutable } from 'shared/types/Immutable';
import { TranslationType } from 'shared/translationType';
import { IStore } from 'app/istore';
import { BackButton } from 'app/Layout';
import { Icon } from 'app/UI';
import { actions, Translate, I18NLink } from 'app/I18N';
import { SelectFileButton } from 'app/App/SelectFileButton';

const prepateTranslations = (translations: IImmutable<TranslationType[]>, context: string) =>
  translations.toJS().map((translation: TranslationType) => {
    const translationsForContext = translation.contexts?.filter(
      translationContext => translationContext?.id === context
    );
    return { ...translation, contexts: translationsForContext };
  });

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
  settings: state.settings,
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

const EditTranslationFromComponent = ({
  context,
  translations,
  saveTranslations,
  importTranslations,
}: mappedProps) => {
  const preparedTranslations = prepateTranslations(translations, context);
  const contextLabel = preparedTranslations[0].contexts[0].label;
  console.log(preparedTranslations);
  return (
    <div className="EditTranslationForm">
      {/* <Form model="translationsForm" onSubmit={this.save}> */}
      <div className="panel panel-default">
        <div className="panel-heading">
          <Translate>Translations</Translate> <Icon icon="angle-right" /> {contextLabel}
        </div>
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
      {/* </Form> */}
    </div>
  );
};
const container = connector(EditTranslationFromComponent);
export { container as EditTranslationFrom };
