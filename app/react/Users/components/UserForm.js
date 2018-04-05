import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { I18NLink } from 'app/I18N';
import { LocalForm, Field } from 'react-redux-form';
import { notEmpty } from 'app/Metadata/helpers/validator';
import { FormGroup } from 'app/Forms';
import t from 'app/I18N/t';
import Immutable from 'immutable';

class UserForm extends Component {
  static formGroup(key, label) {
    return (
      <FormGroup model={`.${key}`}>
        <Field model={`.${key}`}>
          <label className="form-group-label" htmlFor={key}>
            <input id={key} className="form-control"/>
            {label}
          </label>
        </Field>
      </FormGroup>
    );
  }

  static footer() {
    const backUrl = '/settings/users';
    return (
      <div className="settings-footer">
        <I18NLink to={backUrl} className="btn btn-default">
          <i className="fa fa-arrow-left" />
          <span className="btn-label">Back</span>
        </I18NLink>
        <button type="submit" className="btn btn-success save-template">
          <i className="fa fa-save" />
          <span className="btn-label">{t('System', 'Save')}</span>
        </button>
      </div>
    );
  }

  static getClassBasedOnRole(role) {
    return `fa fa-lg fa-fw fa-times ${role === 'admin' ? 'label-success' : 'label-danger'}`;
  }

  static permissions(role, label) {
    return (
      <div className="col-sm-6">
        <div className="well">
          <label htmlFor={role}>
            <input type="radio" id={role} name="role" value={role}/>&nbsp;
            {t('System', label)}
          </label>
          <hr />
          <p><i className="fa fa-lg fa-fw fa-check label-success" />&nbsp;{t('System', 'Upload documents and create entities')}</p>
          <p><i className="fa fa-lg fa-fw fa-check label-success" />&nbsp;{t('System', 'Delete documents and entities')}</p>
          <p><i className="fa fa-lg fa-fw fa-check label-success" />&nbsp;{t('System', 'Apply properties to documents/entities')}</p>
          <p><i className="fa fa-lg fa-fw fa-check label-success" />&nbsp;{t('System', 'Create connections and references')}</p>
          <p><i className="fa fa-lg fa-fw fa-check label-success" />&nbsp;{t('System', 'Create a table of contents')}</p>
          <p><i className={UserForm.getClassBasedOnRole(role)} />&nbsp;{t('System', 'Manage site settings and configuration')}</p>
          <p><i className={UserForm.getClassBasedOnRole(role)} />&nbsp;{t('System', 'Add/delete users and assign roles')}</p>
          <p><i className={UserForm.getClassBasedOnRole(role)} />&nbsp;{t('System', 'Configure filters')}</p>
          <p><i className={UserForm.getClassBasedOnRole(role)} />&nbsp;{t('System', 'Add/edit translations')}</p>
          <p><i className={UserForm.getClassBasedOnRole(role)} />&nbsp;{t('System', 'Create document and entity types')}</p>
          <p><i className={UserForm.getClassBasedOnRole(role)} />&nbsp;{t('System', 'Create dictionaries')}</p>
          <p><i className={UserForm.getClassBasedOnRole(role)} />&nbsp;{t('System', 'Name connections')}</p>
        </div>
      </div>
    );
  }

  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
  }

  submit(user) {
    this.props.submit(user);
  }

  render() {
    const validator = {
      username: { required: notEmpty },
      email: { required: notEmpty },
      role: { required: notEmpty }
    };
    return (
      <div className="user-creator">
        <LocalForm
          initialState={this.props.user.toJS()}
          onSubmit={this.props.submit}
          validators={validator}
        >
          <div className="panel-default panel">
            <div className="panel-heading">
              {this.props.user.get('username') || 'New User'}
            </div>
            <div className="panel-body">
              {UserForm.formGroup('username', t('System', 'Username'))}
              {UserForm.formGroup('email', t('System', 'Email'))}
              <FormGroup model=".role" className="form-group-radio">
                <Field model=".role">
                  {t('System', 'Role')}
                  <div className="row">
                    {UserForm.permissions('admin', 'Admin')}
                    {UserForm.permissions('editor', 'Editor')}
                  </div>
                </Field>
              </FormGroup>
            </div>
            {UserForm.footer()}
          </div>
        </LocalForm>
      </div>
    );
  }
}

UserForm.defaultProps = {
  user: Immutable.fromJS({})
};

UserForm.propTypes = {
  submit: PropTypes.func.isRequired,
  user: PropTypes.instanceOf(Immutable.Map)
};

export default UserForm;
