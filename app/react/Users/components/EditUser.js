import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {I18NLink} from 'app/I18N';
import {connect} from 'react-redux';
import {LocalForm, Field} from 'react-redux-form';
import {notEmpty} from 'app/Metadata/helpers/validator';
import {FormGroup} from 'app/Forms';
import t from 'app/I18N/t';
import {fromJS as Immutable} from 'immutable';

import {saveUser} from 'app/Users/actions/actions';

export class EditUser extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  submit(values) {
    this.props.saveUser(values);
  }

  render() {
    let backUrl = '/settings/users';
    const validator = {
      role: {required: notEmpty}
    };
    return (
      <div className="user-creator">
        <LocalForm
          initialState={this.props.user.toJS()}
          onSubmit={this.submit.bind(this)}
          validators={validator}>
            <div className="metadataTemplate panel-default panel">
            <div className="metadataTemplate-heading panel-heading">
              <div>
                <I18NLink to={backUrl} className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</I18NLink>
                &nbsp;
                {this.props.user.get('username')}
              </div>
            </div>
            <div className="panel-body">
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

EditUser.propTypes = {
  saveUser: PropTypes.func,
  user: PropTypes.object
};

function mapStateToProps({users}, props) {
  return {user: users.find((user) => user.get('_id') === props.params.userId) || Immutable({})};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveUser}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditUser);
