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
  }

  shouldComponentUpdate(nextProps) {
    return this.props.translationsForm.length !== nextProps.translationsForm.length;
  }

  componentWillUnmount() {
    this.props.resetForm();
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
          const translation = { locale: lang.key };
          translation.values = Object.assign({}, defaultTranslation.values);
          translationsForm.push(translation);
        }
      });
    }

    return translationsForm;
  }

  save(_translations) {
    const translations = _translations.map(_translationLanguage => {
      const translationLanguage = Object.assign({}, _translationLanguage);
      translationLanguage.contexts = translationLanguage.contexts.filter(
        ctx => ctx.id === this.props.context
      );
      return translationLanguage;
    });
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
            <button type="submit" className="btn btn-success save-template">
              <Icon icon="save" />
              <span className="btn-label">{t('System', 'Save')}</span>
            </button>
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
    { saveTranslations: actions.saveTranslations, resetForm: actions.resetForm },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(EditTranslationForm);
