import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {Field, Form} from 'react-redux-form';
import {connect} from 'react-redux';
import {I18NLink} from 'app/I18N';

import FormGroup from 'app/DocumentForm/components/FormGroup';
import {actions} from 'app/I18N';

export class EditTranslationForm extends Component {

  render() {
    let context = this.props.context;
    return (
      <div className="row relationType">
          <Form
            model="translationsForm"
            onSubmit={this.props.saveTranslations}
          >
            <div className="panel panel-default">
              <div className="panel-heading">
                <I18NLink to="/settings/translations" className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</I18NLink>
                &nbsp;
                <button type="submit" className="btn btn-success save-template">
                  <i className="fa fa-save"/> Save
                </button>
              </div>
              <ul className="list-group">
                <li className="list-group-item"><b>{context}</b></li>
                {(() => {
                  if (this.props.translations.length) {
                    return Object.keys(this.props.translations[0].values[context]).map((value) => {
                      return <li key={value} className="list-group-item">
                        <div>{value}</div>
                        {this.props.translations.map((translation, i) => {
                          return <FormGroup key={`${translation.locale}-${value}-${i}`}>
                          <div className="input-group">
                          <span className="input-group-addon">{translation.locale}</span>
                            <Field model={`translationsForm[${i}].values[${context}][${value}]`}>
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
  translations: PropTypes.array,
  saveTranslations: PropTypes.func,
  formState: PropTypes.object
};

function translationExists(translations, locale) {
  return translations.find((tr) => tr.locale === locale);
}

function getDefaultTranslation(translations, languages) {
  let defaultLocale = languages.find((lang) => lang.default).key;
  return translations.find((tr) => tr.locale === defaultLocale);
}

export function mapStateToProps(state) {

  let translations = state.translationsForm;
  if (translations.length) {
    let languages = state.settings.collection.toJS().languages;
    languages.forEach((lang) => {
      if (!translationExists(translations, lang.key)) {
        let defaultTranslation = getDefaultTranslation(translations, languages);
        let translation = {locale: lang.key};
        translation.values = Object.assign({}, defaultTranslation.values);
        translations.push(translation);
      }
    });
  }

  return {
    translations,
    formState: state.translationsFormState
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveTranslations: actions.saveTranslations}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditTranslationForm);
