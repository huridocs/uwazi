import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Immutable from 'immutable';

import { t } from 'app/I18N';
import { LocalForm, Field } from 'react-redux-form';
import { notEmpty } from 'app/Metadata/helpers/validator';
import { FormGroup } from 'app/Forms';
import { BackButton } from 'app/Layout';
import { Icon } from 'UI';

class UserForm extends Component {
  static formGroup(key, label, type = 'text') {
    return (
      <FormGroup model={`.${key}`}>
        <Field model={`.${key}`}>
          <label className="form-group-label" htmlFor={key}>
            <input type={type} id={key} className="form-control" />
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
        <BackButton to={backUrl} />
        <button type="submit" className="btn btn-success save-template">
          <Icon icon="save" />
          <span className="btn-label">{t('System', 'Save')}</span>
        </button>
      </div>
    );
  }

  static getClassBasedOnRole(role) {
    return `${role === 'admin' ? 'label-success' : 'label-danger'}`;
  }

  static getIconBasedOnRole(role) {
    return `${role === 'admin' ? 'check' : 'times'}`;
  }

  static permissions(role, label) {
    return (
      <div className="col-sm-6">
        <div className="well">
          <label htmlFor={role}>
            <input type="radio" id={role} name="role" value={role} />
            &nbsp;
            {t('System', label)}
          </label>
          <hr />
          <p>
            <Icon icon="check" className="label-success" />
            &nbsp;
            {t('System', 'Upload documents and create entities')}
          </p>
          <p>
            <Icon icon="check" className="label-success" />
            &nbsp;
            {t('System', 'Delete documents and entities')}
          </p>
          <p>
            <Icon icon="check" className="label-success" />
            &nbsp;
            {t('System', 'Apply properties to documents/entities')}
          </p>
          <p>
            <Icon icon="check" className="label-success" />
            &nbsp;
            {t('System', 'Create connections and references')}
          </p>
          <p>
            <Icon icon="check" className="label-success" />
            &nbsp;
            {t('System', 'Create a table of contents')}
          </p>
          <p>
            <Icon
              icon={UserForm.getIconBasedOnRole(role)}
              className={UserForm.getClassBasedOnRole(role)}
            />
            &nbsp;
            {t('System', 'Manage site settings and configuration')}
          </p>
          <p>
            <Icon
              icon={UserForm.getIconBasedOnRole(role)}
              className={UserForm.getClassBasedOnRole(role)}
            />
            &nbsp;
            {t('System', 'Add/delete users and assign roles')}
          </p>
          <p>
            <Icon
              icon={UserForm.getIconBasedOnRole(role)}
              className={UserForm.getClassBasedOnRole(role)}
            />
            &nbsp;
            {t('System', 'Configure filters')}
          </p>
          <p>
            <Icon
              icon={UserForm.getIconBasedOnRole(role)}
              className={UserForm.getClassBasedOnRole(role)}
            />
            &nbsp;
            {t('System', 'Add/edit translations')}
          </p>
          <p>
            <Icon
              icon={UserForm.getIconBasedOnRole(role)}
              className={UserForm.getClassBasedOnRole(role)}
            />
            &nbsp;
            {t('System', 'Create document and entity types')}
          </p>
          <p>
            <Icon
              icon={UserForm.getIconBasedOnRole(role)}
              className={UserForm.getClassBasedOnRole(role)}
            />
            &nbsp;
            {t('System', 'Create dictionaries')}
          </p>
          <p>
            <Icon
              icon={UserForm.getIconBasedOnRole(role)}
              className={UserForm.getClassBasedOnRole(role)}
            />
            &nbsp;
            {t('System', 'Name connections')}
          </p>
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
      role: { required: notEmpty },
    };
    return (
      <div className="user-creator">
        <LocalForm
          initialState={this.props.user.toJS()}
          onSubmit={this.props.submit}
          validators={validator}
        >
          <div className="panel-default panel">
            <div className="panel-heading">{this.props.user.get('username') || 'New User'}</div>
            <div className="panel-body">
              {UserForm.formGroup('username', t('System', 'Username'))}
              {UserForm.formGroup('email', t('System', 'Email'))}
              {UserForm.formGroup('password', t('System', 'Password'), 'password')}
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
  user: Immutable.fromJS({}),
};

UserForm.propTypes = {
  submit: PropTypes.func.isRequired,
  user: PropTypes.instanceOf(Immutable.Map),
};

export default UserForm;
