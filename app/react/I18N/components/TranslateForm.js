import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { Form, Field } from 'react-redux-form';
import { connect } from 'react-redux';
import { actions, Translate, t } from 'app/I18N';
import Modal from 'app/Layout/Modal';
import { FormGroup } from 'app/Forms';

export class TranslateForm extends Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.cancel = this.cancel.bind(this);
  }

  submit(values) {
    let translations = this.props.translations.toJS();
    translations = translations.map(translation => {
      const { locale } = translation;
      const context = translation.contexts.find(c => c.id === this.props.context);
      context.values[this.props.value] = values[locale];
      translation.contexts = [context];
      return translation;
    });
    this.props.saveTranslations(translations);
    this.props.close();
  }

  cancel() {
    this.props.close();
  }

  render() {
    const translations = this.props.translations.toJS();
    const languages = translations.map(translation => translation.locale);

    return (
      <Modal isOpen={this.props.isOpen} type="info">
        <Modal.Body>
          <h4>
            <Translate>Translate</Translate>
          </h4>
          <Form model="inlineEditModel" onSubmit={this.submit} id="inlineEdit">
            {languages.map(language => (
              <FormGroup key={language} model={`.${language}`}>
                <Field model={`.${language}`}>
                  <label className="form-group-label" htmlFor={language}>
                    {language}
                    <input id={language} className="form-control" />
                  </label>
                </Field>
              </FormGroup>
            ))}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-default cancel-button" onClick={this.cancel}>
            {t('System', 'Cancel', null, false)}
          </button>
          <button type="submit" form="inlineEdit" className="btn confirm-button btn-primary">
            {t('System', 'Submit', null, false)}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

TranslateForm.defaultProps = {
  isOpen: false,
};

TranslateForm.propTypes = {
  saveTranslations: PropTypes.func.isRequired,
  close: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  context: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  translations: PropTypes.instanceOf(Object).isRequired,
};

export function mapStateToProps(state) {
  return {
    translations: state.translations,
    isOpen: state.inlineEdit.get('showInlineEditForm'),
    context: state.inlineEdit.get('context'),
    value: state.inlineEdit.get('key'),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    { saveTranslations: actions.saveTranslations, close: actions.closeInlineEditTranslation },
    dispatch
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(TranslateForm);
