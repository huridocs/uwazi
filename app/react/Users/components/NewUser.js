import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {I18NLink} from 'app/I18N';
import {connect} from 'react-redux';
import {LocalForm, Field} from 'react-redux-form';
import {notEmpty} from 'app/Metadata/helpers/validator';
import {FormGroup} from 'app/Forms';

import {saveUser} from 'app/Users/actions/actions';

export class NewUser extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  }

  submit(values) {

  }

  render() {
    let backUrl = '/settings/users';
    let nameGroupClass = 'form-group';
    const validator = {
      username: {required: notEmpty},
      email: {required: notEmpty}
    };
    return (
      <div className="account-settings">
        <div className="panel panel-default">
          <LocalForm
            onSubmit={this.submit.bind(this)}
            validators={validator}>
            <div className="metadataTemplate-heading panel-heading">
              <I18NLink to={backUrl} className="btn btn-default"><i className="fa fa-arrow-left"></i> Back</I18NLink>&nbsp;
              <FormGroup model={'.username'}>
                <Field model=".username">
                  <label className="form-group-label" htmlFor="username">User name</label>
                  <input id="username" className="form-control"/>
                </Field>
              </FormGroup>
              &nbsp;
              <div className={nameGroupClass}>
                <Field model=".email">
                  <label className="form-group-label" htmlFor="email">Email</label>
                  <input id="email" className="form-control"/>
                </Field>
              </div>
              &nbsp;
              <button type="submit" className="btn btn-success save-template">
                <i className="fa fa-save"></i> Save
              </button>
            </div>
          </LocalForm>
        </div>
      </div>
    );
  }
}

NewUser.propTypes = {
  saveUser: PropTypes.func
};

function mapStateToProps(state) {
  return state;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({saveUser}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(NewUser);
