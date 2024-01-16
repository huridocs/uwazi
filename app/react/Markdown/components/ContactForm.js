import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { actions, Field } from 'react-redux-form';
import { FormGroup } from 'app/ReactReduxForms';
import { Translate, t } from 'app/I18N';
import api from 'app/utils/api';
import { Icon } from 'UI';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { RequestParams } from 'app/utils/RequestParams';
import { LocalForm } from 'app/Forms/Form';
import { FormCaptcha } from './FormCaptcha';

class ContactForm extends Component {
  constructor(props, context) {
    super(props, context);
    this.submit = this.submit.bind(this);
    this.validators = {
      name: { required: val => val && val.length > 2 },
      email: { required: val => val },
      message: { required: val => val && val.length > 4 },
      captcha: { required: val => val && val.text.length },
    };
    this.refreshFn = refresh => {
      this.refreshCaptcha = refresh;
    };
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  resetForm() {
    this.formDispatch(actions.reset('contactform'));
  }

  async submit(values) {
    try {
      await api.post(
        'contact',
        new RequestParams({
          name: values.name,
          email: values.email,
          message: values.message,
          captcha: JSON.stringify(values.captcha),
        })
      );
      this.props.notify(t('System', 'Message sent', null, false), 'success');
      this.resetForm();
    } catch (e) {
      if (e.status === 403) {
        this.props.notify(e.json.error, 'danger');
      } else {
        this.props.notify(t('System', 'An error occurred', null, false), 'danger');
        this.resetForm();
      }
    }

    this.refreshCaptcha();
  }

  render() {
    return (
      <LocalForm
        validators={this.validators}
        model="contactform"
        className="contact-form"
        getDispatch={dispatch => this.attachDispatch(dispatch)}
        onSubmit={this.submit}
      >
        <FormGroup model=".name">
          <label className="form-group-label" htmlFor="name">
            <Translate>Name</Translate>
            <span className="required">*</span>
          </label>

          <Field model=".name">
            <input type="text" name="name" className="form-control" />
          </Field>
        </FormGroup>

        <FormGroup model=".email">
          <label className="form-group-label" htmlFor="email">
            <Translate>Email</Translate>
            <span className="required">*</span>
          </label>

          <Field model=".email">
            <input type="email" name="email" className="form-control" />
          </Field>
        </FormGroup>

        <FormGroup model=".message">
          <label className="form-group-label" htmlFor="message">
            <Translate>Message</Translate>
            <span className="required">*</span>
          </label>

          <Field model=".message">
            <textarea name="message" className="form-control" />
          </Field>
        </FormGroup>

        <FormCaptcha refresh={this.refreshFn} />

        <button type="submit" className="btn btn-success">
          <Icon icon="paper-plane" />
          &nbsp;
          <span className="btn-label">
            <Translate>Send</Translate>
          </span>
        </button>
      </LocalForm>
    );
  }
}

ContactForm.propTypes = {
  notify: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ notify }, dispatch);
}

export { ContactForm };
export default connect(null, mapDispatchToProps)(ContactForm);
