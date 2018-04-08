import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { Field, Form } from 'react-redux-form';
import { connect } from 'react-redux';
import { I18NLink, t, actions } from 'app/I18N';

import FormGroup from 'app/DocumentForm/components/FormGroup';

export class EditTranslationForm extends Component {
  translationExists(translations, locale) {
    return translations.find(tr => tr.locale === locale);
  }

  getDefaultTranslation(translations, languages) {
    const defaultLocale = languages.find(lang => lang.default).key;
    return translations.find(tr => tr.locale === defaultLocale);
  }

  prepareTranslations() {
    const translations = this.props.translationsForm;

    if (translations.length) {
      const languages = this.props.settings.collection.toJS().languages;
      languages.forEach((lang) => {
        if (!this.translationExists(translations, lang.key)) {
          const defaultTranslation = this.getDefaultTranslation(translations, languages);
          const translation = { locale: lang.key };
          translation.values = Object.assign({}, defaultTranslation.values);
          translations.push(translation);
        }
      });
    }

    return translations;
  }

  shouldComponentUpdate(nextProps) {
    return this.props.translationsForm.length !== nextProps.translationsForm.length;
  }

  componentWillUnmount() {
    this.props.resetForm();
  }

  render() {
    const contextId = this.props.context;
    let defaultTranslationContext = { values: [] };

    const translations = this.prepareTranslations.call(this);
    if (translations.length) {
      defaultTranslationContext = translations[0].contexts.find(ctx => ctx.id === contextId) || defaultTranslationContext;
    }

    const contextKeys = Object.keys(defaultTranslationContext.values);

    const contextName = defaultTranslationContext.label;
    return (
      <div className="EditTranslationForm">
        <Form
          model="translationsForm"
          onSubmit={this.props.saveTranslations}
        >
          <div className="panel panel-default">
            <div className="panel-heading">
              {t('System', 'Translations')} <i className="fa fa-angle-right" /> {contextName}
            </div>
            <ul className="list-group">
              {(() => {
                  if (translations.length) {
                    return contextKeys.sort().map(value => (<li key={value} className="list-group-item">
                      <h5>{value}</h5>
                      {translations.map((translation, i) => {
                          const context = translation.contexts.find(ctx => ctx.id === contextId);
                          const index = translation.contexts.indexOf(context);
                          return (<FormGroup key={`${translation.locale}-${value}-${i}`}>
                            <div className="input-group">
                              <span className="input-group-addon">{translation.locale}</span>
                              <Field model={`translationsForm[${i}].contexts[${index}].values["${value}"]`}>
                                <input className="form-control" type="text" />
                              </Field>
                            </div>
                                  </FormGroup>);
                        })}
                    </li>));
                  }
                })()}
            </ul>
          </div>
          <div className="settings-footer">
            <I18NLink to="/settings/translations" className="btn btn-default">
              <i className="fa fa-arrow-left" />
              <span className="btn-label">Back</span>
            </I18NLink>
            <button type="submit" className="btn btn-success save-template">
              <i className="fa fa-save"/>
              <span className="btn-label">{t('System', 'Save')}</span>
            </button>
          </div>
        </Form>
      </div>
    );
  }
}

EditTranslationForm.propTypes = {
  context: PropTypes.string,
  translationsForm: PropTypes.array,
  settings: PropTypes.object,
  saveTranslations: PropTypes.func,
  resetForm: PropTypes.func,
  formState: PropTypes.object
};

export function mapStateToProps({ translationsForm, translationsFormState, settings }) {
  return {
    translationsForm,
    settings,
    formState: translationsFormState
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ saveTranslations: actions.saveTranslations, resetForm: actions.resetForm }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditTranslationForm);
