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
      <div className="user-creator">
        <LocalForm
          onSubmit={this.submit.bind(this)}
          validators={validator}>
            <div className="panel-default panel">
            <div className="panel-heading">
              New user
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
                  <div className="row">
                    <div className="col-sm-6">
                      <div className="well">
                        <input type="radio" id="editor" name="role" value="editor"/>&nbsp;<label htmlFor="editor">{t('System', 'Editor')}</label>
                        <hr />
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Upload documents and create entities')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Delete documents and entities')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Apply properties to documents/entities')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Create connections and references')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Create a table of contents')}</p>
                        <p><i className="fa fa-lg fa-fw fa-times label-danger"></i>&nbsp;{t('System', 'Manage site settings and configuration')}</p>
                        <p><i className="fa fa-lg fa-fw fa-times label-danger"></i>&nbsp;{t('System', 'Add/delete users and assign roles')}</p>
                        <p><i className="fa fa-lg fa-fw fa-times label-danger"></i>&nbsp;{t('System', 'Configure filters')}</p>
                        <p><i className="fa fa-lg fa-fw fa-times label-danger"></i>&nbsp;{t('System', 'Add/edit translations')}</p>
                        <p><i className="fa fa-lg fa-fw fa-times label-danger"></i>&nbsp;{t('System', 'Create document and entity types')}</p>
                        <p><i className="fa fa-lg fa-fw fa-times label-danger"></i>&nbsp;{t('System', 'Create dictionaries')}</p>
                        <p><i className="fa fa-lg fa-fw fa-times label-danger"></i>&nbsp;{t('System', 'Name connections')}</p>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="well">
                        <input type="radio" id="admin" name="role" value="admin"/>&nbsp;<label htmlFor="admin">{t('System', 'Admin')}</label>&nbsp;
                        <hr />
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Upload documents and create entities')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Delete documents and entities')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Apply properties to documents/entities')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Create connections and references')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Create a table of contents')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Manage site settings and configuration')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Add/delete users and assign roles')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Configure filters')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Add/edit translations')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Create document and entity types')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Create dictionaries')}</p>
                        <p><i className="fa fa-lg fa-fw fa-check label-success"></i>&nbsp;{t('System', 'Name connections')}</p>
                      </div>
                    </div>
                  </div>
                </Field>
              </FormGroup>
            </div>
            <div className="settings-footer">
              <I18NLink to={backUrl} className="btn btn-default">
                <i className="fa fa-arrow-left"></i>
                <span className="btn-label">Back</span>
              </I18NLink>
              <button type="submit" className="btn btn-success save-template">
                <i className="fa fa-save"></i>
                <span className="btn-label">{t('System', 'Save')}</span>
              </button>
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
