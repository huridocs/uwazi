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
      <div className="account-settings">
        <LocalForm
          initialState={this.props.user.toJS()}
          onSubmit={this.submit.bind(this)}
          validators={validator}>
            <div className="metadataTemplate panel-default panel">
            <div className="metadataTemplate-heading panel-heading">
              <I18NLink to={backUrl} className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</I18NLink>
              {this.props.user.username}
              <button type="submit" className="btn btn-success save-template">
                <i className="fa fa-save"></i> {t('System', 'Save')}
              </button>
            </div>
            <div className="panel-body">
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
