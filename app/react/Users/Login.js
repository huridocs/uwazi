import React from 'react';
import {Component, PropTypes} from 'react';
import {browserHistory} from 'react-router';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Field, Form, actions as formActions} from 'react-redux-form';

import auth from 'app/Auth';

export class Login extends Component {

  submit(credentials) {
    return this.props.login(credentials)
    .then(() => {
      browserHistory.push('/');
    })
    .catch(() => {
    });
  }

  render() {
    return <div className="content login-content">
      <div className="row">
        <div className="col-xs-12 col-sm-4 col-sm-offset-4">
          <h1>uwazi</h1>
          <Form onSubmit={this.submit.bind(this)} model="login.form">
            <div className="form-group login-email">
              <Field model="login.form.username">
                <label htmlFor="username">Login</label>
                <input type="text" name="username" id="username" className="form-control"/>
              </Field>
            </div>
            <div className="form-group login-password">
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <Field model="login.form.password">
                  <input type="password" name="password" id="password" className="form-control"/>
                </Field>
                  <span className="input-group-btn">
                    <div title="Don't remember your password?" className="btn btn-default">
                      <i className="fa fa-question"></i>
                    </div>
                  </span>
              </div>
            </div>
            <button type="submit" className="btn btn-block btn-lg btn-primary">Login</button>
          </Form>
        </div>
      </div>
    </div>;
  }
}

Login.propTypes = {
  login: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({login: auth.actions.login}, dispatch);
}

export default connect(null, mapDispatchToProps)(Login);
