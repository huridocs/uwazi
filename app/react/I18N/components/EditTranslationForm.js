import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { Field, Form } from 'react-redux-form';
import { connect } from 'react-redux';
import { t, actions } from 'app/I18N';
import { BackButton } from 'app/Layout';
import { Icon } from 'UI';

import FormGroup from 'app/DocumentForm/components/FormGroup';

export class EditTranslationForm extends Component {
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
    this.onImportClicked = this.onImportClicked.bind(this);
    this.import = this.import.bind(this);
    this.fileInputRef = React.createRef();
    this.fileFormRef = React.createRef();
  }

  shouldComponentUpdate(nextProps) {
    return this.props.translationsForm.length !== nextProps.translationsForm.length;
  }

  componentWillUnmount() {
    this.props.resetForm();
  }

  onImportClicked() {
    this.fileInputRef.current.click();
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

  import() {
    const file = this.fileInputRef.current.files[0];
    this.fileFormRef.current.reset();
    if (file) {
      this.props.importTranslations(this.props.context, file);
    }
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
    let importButton;

    const translations = this.prepareTranslations.call(this);
    if (translations.length) {
      defaultTranslationContext =
        translations[0].contexts.find(ctx => ctx.id === contextId) || defaultTranslationContext;
    }

    if (contextId === 'System') {
      importButton = (
        <button
          type="button"
          className="btn btn-primary import-template"
          onClick={this.onImportClicked}
        >
          <Icon icon="upload" />
          <span className="btn-label">Import</span>
        </button>
      );
    }

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
            <BackButton to="/settings/translations" />
            {importButton}
            <button type="submit" className="btn btn-success save-template">
              <Icon icon="save" />
              <span className="btn-label">{t('System', 'Save')}</span>
            </button>
          </div>
        </Form>
        <form ref={this.fileFormRef} style={{ display: 'none' }}>
          <input
            ref={this.fileInputRef}
            type="file"
            accept="text/csv"
            style={{ display: 'none' }}
            onChange={this.import}
          />
        </form>
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

export function mapStateToProps({ translationsForm, translationsFormState, settings }) {
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

export default connect(mapStateToProps, mapDispatchToProps)(EditTranslationForm);
