import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';
import {connect} from 'react-redux';
import {I18NLink, t, actions} from 'app/I18N';

import FormGroup from 'app/DocumentForm/components/FormGroup';

export class EditTranslationForm extends Component {

  translationExists(translations, locale) {
    return translations.find((tr) => tr.locale === locale);
  }

  getDefaultTranslation(translations, languages) {
    let defaultLocale = languages.find((lang) => lang.default).key;
    return translations.find((tr) => tr.locale === defaultLocale);
  }

  getNewSystemTranslations() {

  }

  prepareTranslations() {
    const translations = this.props.translationsForm;

    if (translations.length) {
      let languages = this.props.settings.collection.toJS().languages;
      languages.forEach((lang) => {
        if (!this.translationExists(translations, lang.key)) {
          let defaultTranslation = this.getDefaultTranslation(translations, languages);
          let translation = {locale: lang.key};
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
    let contextId = this.props.context;
    let defaultTranslationContext = {values: []};

    const translations = this.prepareTranslations.call(this);
    if (translations.length) {
      defaultTranslationContext = translations[0].contexts.find((ctx) => ctx.id === contextId) || defaultTranslationContext;
    }

    if (this.props.context === 'System') {
      
    }
    let contextKeys = Object.keys(defaultTranslationContext.values);

    let contextName = defaultTranslationContext.label;
    return (
      <div className="relationType">
          <Form
            model="translationsForm"
            onSubmit={this.props.saveTranslations}>
            <div className="panel panel-default">
              <div className="panel-heading">
                <I18NLink to="/settings/translations" className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</I18NLink>
                &nbsp;
                <button type="submit" className="btn btn-success save-template">
                  <i className="fa fa-save"/> {t('System', 'Save')}
                </button>
              </div>
              <ul className="list-group">
                <li className="list-group-item"><b>{contextName}</b></li>
                {(() => {
                  if (translations.length) {
                    return contextKeys.sort().map((value) => {
                      return <li key={value} className="list-group-item">
                        <h5>{value}</h5>
                        {translations.map((translation, i) => {
                          let context = translation.contexts.find((ctx) => ctx.id === contextId);
                          let index = translation.contexts.indexOf(context);
                          return <FormGroup key={`${translation.locale}-${value}-${i}`}>
                          <div className="input-group">
                          <span className="input-group-addon">{translation.locale}</span>
                            <Field model={`translationsForm[${i}].contexts[${index}].values[${value}]`}>
                              <input className="form-control" type="text" />
                            </Field>
                          </div>
                          </FormGroup>;
                        })}
                      </li>;
                    });
                  }
                })()}
              </ul>
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

export function mapStateToProps({translationsForm, translationsFormState, settings}) {
  return {
    translationsForm,
    settings,
    formState: translationsFormState
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveTranslations: actions.saveTranslations, resetForm: actions.resetForm}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditTranslationForm);
