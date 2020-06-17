import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Translate } from 'app/I18N';
import api from 'app/utils/api';
import { Icon } from 'UI';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { RequestParams } from 'app/utils/RequestParams';

export class ContactForm extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { name: '', email: '', message: '' };
    this.submit = this.submit.bind(this);
  }

  onChange(key, e) {
    const changedData = {};
    changedData[key] = e.target.value;
    this.setState(changedData);
  }

  async submit(e) {
    e.preventDefault();
    await api.post('contact', new RequestParams(this.state));
    this.props.notify('Message sent', 'success');
    this.setState({ name: '', email: '', message: '' });
  }

  render() {
    return (
      <form onSubmit={this.submit} className="contact-form">
        <div className="form-group">
          <label className="form-group-label" htmlFor="name">
            <Translate>Name</Translate>
          </label>
          <input
            required
            name="name"
            className="form-control"
            onChange={this.onChange.bind(this, 'name')}
            value={this.state.name}
          />
        </div>
        <div className="form-group">
          <label className="form-group-label" htmlFor="email">
            <Translate>Email</Translate>
          </label>
          <input
            required
            name="email"
            className="form-control"
            onChange={this.onChange.bind(this, 'email')}
            value={this.state.email}
          />
        </div>
        <div className="form-group">
          <label className="form-group-label" htmlFor="message">
            <Translate>Message</Translate>
          </label>
          <textarea
            required
            name="message"
            className="form-control"
            onChange={this.onChange.bind(this, 'message')}
            value={this.state.message}
          />
        </div>
        <button type="submit" className="btn btn-success">
          <Icon icon="paper-plane" />
          &nbsp;
          <span className="btn-label">
            <Translate>Send</Translate>
          </span>
        </button>
      </form>
    );
  }
}

ContactForm.propTypes = {
  notify: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ notify }, dispatch);
}

export default connect(null, mapDispatchToProps)(ContactForm);
