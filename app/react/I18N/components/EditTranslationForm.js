import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { Field, Form } from 'react-redux-form';
import { connect } from 'react-redux';
import { t, actions, Translate, I18NLink } from 'app/I18N';
import { BackButton } from 'app/Layout';
import { Icon } from 'UI';

import FormGroup from 'app/DocumentForm/components/FormGroup';
import { SelectFileButton } from 'app/App/SelectFileButton';

class EditTranslationForm extends Component {
  static getDefaultTranslation(translations, languages) {
    const defaultLocale = languages.find(lang => lang.default).key;
    return translations.find(tr => tr.locale === defaultLocale);
  }

  static translationExists(translations, locale) {
    return translations.find(tr => tr.locale === locale);
  }

  constructor(props) {
    super(props);
    this.save = this.save.bind(this);
    this.importTranslationsFile = this.importTranslationsFile.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return this.props.translationsForm.length !== nextProps.translationsForm.length;
  }

  componentWillUnmount() {
    this.props.resetForm();
  }

  importTranslationsFile(file) {
    this.props.importTranslations(this.props.context, file);
  }

  prepareTranslations() {
    const { translationsForm, settings } = this.props;

    if (translationsForm.length) {
      const { languages } = settings.collection.toJS();
      languages.forEach(lang => {
        if (!EditTranslationForm.translationExists(translationsForm, lang.key)) {
          const defaultTranslation = EditTranslationForm.getDefaultTranslation(
            translationsForm,
            languages
          );
          const translation = {
            locale: lang.key,
            values: { ...defaultTranslation.values },
          };

          translationsForm.push(translation);
        }
      });
    }

    return translationsForm;
  }

  save(_translations) {
    const translations = _translations.map(translationLanguage => ({
      ...translationLanguage,
      contexts: translationLanguage.contexts.filter(ctx => ctx.id === this.props.context),
    }));
    this.props.saveTranslations(translations);
  }

  render() {
    const contextId = this.props.context;
    let defaultTranslationContext = { values: [] };

    const translations = this.prepareTranslations.call(this);
    if (translations.length) {
      defaultTranslationContext =
        translations[0].contexts.find(ctx => ctx.id === contextId) || defaultTranslationContext;
    }

    const importButton =
      contextId === 'System' ? (
        <SelectFileButton onFileImported={this.importTranslationsFile}>
          <button type="button" className="btn btn-default import-template">
            <Icon icon="upload" />
            <span className="btn-label">
              <Translate>Import</Translate>
            </span>
          </button>
        </SelectFileButton>
      ) : (
        false
      );

    const contextKeys = Object.keys(defaultTranslationContext.values);

    const contextName = defaultTranslationContext.label;
    return (
      <div className="EditTranslationForm">
        <Form model="translationsForm" onSubmit={this.save}>
          <div className="panel panel-default">
            <div className="panel-heading">
              {t('System', 'Translations')} <Icon icon="angle-right" /> {contextName}
            </div>
            <ul className="list-group">
              {(() => {
                if (translations.length) {
                  return contextKeys.sort().map(value => (
                    <li key={value} className="list-group-item">
                      <h5>{value}</h5>
                      {translations.map((translation, i) => {
                        const context = translation.contexts.find(ctx => ctx.id === contextId);
                        const index = translation.contexts.indexOf(context);
                        return (
                          <FormGroup key={`${translation.locale}-${value}-${i}`}>
                            <div className="input-group">
                              <span className="input-group-addon">{translation.locale}</span>
                              <Field
                                model={['translationsForm', i, 'contexts', index, 'values', value]}
                              >
                                <input className="form-control" type="text" />
                              </Field>
                            </div>
                          </FormGroup>
                        );
                      })}
                    </li>
                  ));
                }
              })()}
            </ul>
          </div>
          <div className="settings-footer">
            <div className="btn-cluster">
              <BackButton to="/settings/translations" className="btn-plain" />
              {importButton}
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
        </Form>
      </div>
    );
  }
}

EditTranslationForm.propTypes = {
  context: PropTypes.string.isRequired,
  translationsForm: PropTypes.array,
  settings: PropTypes.object,
  saveTranslations: PropTypes.func,
  importTranslations: PropTypes.func.isRequired,
  resetForm: PropTypes.func,
  formState: PropTypes.object,
};

function mapStateToProps({ translationsForm, translationsFormState, settings }) {
  return {
    translationsForm,
    settings,
    formState: translationsFormState,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      saveTranslations: actions.saveTranslations,
      resetForm: actions.resetForm,
      importTranslations: actions.importTranslations,
    },
    dispatch
  );
}

export { EditTranslationForm, mapStateToProps };

export default connect(mapStateToProps, mapDispatchToProps)(EditTranslationForm);
