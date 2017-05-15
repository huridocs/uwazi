import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {I18NLink} from 'app/I18N';
import {connect} from 'react-redux';
import {LocalForm, Field} from 'react-redux-form';
import {notEmpty} from 'app/Metadata/helpers/validator';
import {FormGroup} from 'app/Forms';
import t from 'app/I18N/t';

import {newUser} from 'app/Users/actions/actions';

export class NewUser extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  submit(values) {
    this.props.newUser(values);
  }

  render() {
    let backUrl = '/settings/users';
    const validator = {
      username: {required: notEmpty},
      email: {required: notEmpty},
      role: {required: notEmpty}
    };
    return (
      <div className="account-settings">
        <LocalForm
          onSubmit={this.submit.bind(this)}
          validators={validator}>
            <div className="metadataTemplate panel-default panel">
            <div className="metadataTemplate-heading panel-heading">
              <I18NLink to={backUrl} className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</I18NLink>
              <button type="submit" className="btn btn-success save-template">
                <i className="fa fa-save"></i> {t('System', 'Save')}
              </button>
            </div>
            <div className="panel-body">
              <FormGroup model=".username">
                <Field model=".username">
                  <label className="form-group-label" htmlFor="username">{t('System', 'Username')}</label>
                  <input id="username" className="form-control"/>
                </Field>
              </FormGroup>
              <FormGroup model=".email">
                <Field model=".email">
                  <label className="form-group-label" htmlFor="email">{t('System', 'Email')}</label>
                  <input id="email" className="form-control"/>
                </Field>
              </FormGroup>
              <FormGroup model=".role" className="form-group-radio">
                <Field model=".role">
                  <label className="form-group-label" htmlFor="email">{t('System', 'Role')}</label>
                  <div>
                  <input type="radio" id="admin" name="role" value="admin"/>&nbsp;<label htmlFor="admin">{t('System', 'Admin')}</label>&nbsp;
                  <input type="radio" id="editor" name="role" value="editor"/>&nbsp;<label htmlFor="editor">{t('System', 'Editor')}</label>
                  </div>
                </Field>
              </FormGroup>
            </div>
          </div>
        </LocalForm>
      </div>
    );
  }
}

NewUser.propTypes = {
  newUser: PropTypes.func
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({newUser}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(NewUser);
