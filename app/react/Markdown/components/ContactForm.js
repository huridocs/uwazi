import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { actions, Field } from 'react-redux-form';
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
      name: { required: val => val },
      email: { required: val => val },
      message: { required: val => val },
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
    console.log(values);
    try {
      await api.post('contact', new RequestParams(values));
      this.props.notify(t('System', 'Message sent', null, false), 'success');
      this.resetForm();
    } catch (e) {
      this.props.notify(t('System', 'An error occurred', null, false), 'danger');
      this.resetForm();
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
        <div className="form-group">
          <label className="form-group-label" htmlFor="name">
            <Translate>Name</Translate>
            <span className="required">*</span>
          </label>

          <Field model=".name">
            <input type="text" required name="name" className="form-control" />
          </Field>
        </div>

        <div className="form-group">
          <label className="form-group-label" htmlFor="email">
            <Translate>Email</Translate>
            <span className="required">*</span>
          </label>

          <Field model=".email">
            <input type="email" required name="email" className="form-control" />
          </Field>
        </div>

        <div className="form-group">
          <label className="form-group-label" htmlFor="message">
            <Translate>Message</Translate>
            <span className="required">*</span>
          </label>

          <Field model=".message">
            <textarea required name="message" className="form-control" />
          </Field>
        </div>

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
