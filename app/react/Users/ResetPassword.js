import PropTypes from 'prop-types';
import React from 'react';
import RouteHandler from 'app/App/RouteHandler';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import queryString from 'query-string';

import auth from 'app/Auth';

export class ResetPassword extends RouteHandler {

  constructor(props, context) {
    super(props, context);
    this.state = {error: false, password: '', repeatPassword: ''};
    this.submit = this.submit.bind(this);
    this.passwordChange = this.passwordChange.bind(this);
    this.repeatPasswordChange = this.repeatPasswordChange.bind(this);
  }

  static requestState() {
    return Promise.resolve({});
  }

  conformHelperText(searchString) {
    const search = queryString.parse(searchString);
    return search.createAcount !== 'true' ? null :
      <div className="alert alert-info">
        <i className="fa fa-info-circle"></i>
        <div>To complete the account creation process, please create a password for your account</div>
      </div>;
  }

  passwordChange(e) {
    this.setState({password: e.target.value});
    this.setState({passwordError: false});
  }

  repeatPasswordChange(e) {
    this.setState({repeatPassword: e.target.value});
    this.setState({passwordError: false});
  }

  submit(e) {
    e.preventDefault();
    let passwordsDontMatch = this.state.password !== this.state.repeatPassword;
    let emptyPassword = this.state.password.trim() === '';
    if (emptyPassword || passwordsDontMatch) {
      this.setState({error: true});
      return;
    }

    this.props.resetPassword(this.state.password, this.props.params.key);
    this.setState({password: '', repeatPassword: ''});
  }


  render() {
    return <div className="content login-content">
      <div className="row">
        <div className="col-xs-12 col-sm-4 col-sm-offset-4">
          {this.conformHelperText(this.context.router.location.search)}
          <form onSubmit={this.submit}>
            <div className={'form-group login-email' + (this.state.error ? ' has-error' : '')}>
              <label className="form-group-label" htmlFor="password">Password</label>
              <input
                onChange={this.passwordChange}
                value={this.state.password}
                type="password" name="password" id="password" className="form-control"/>
            </div>
            <div className={'form-group login-password ' + (this.state.error ? 'has-error' : '')}>
              <label className="form-group-label" htmlFor="repeat-password">Repeat Password</label>
              <input
                value={this.state.repeatPassword}
                onChange={this.repeatPasswordChange}
                type="password" name="repeat-password" id="repeat-password" className="form-control"/>
              <div className="required">Passwords don&rsquo;t match</div>
            </div>
            <button type="submit" className="btn btn-block btn-lg btn-primary">
              Save password
            </button>
          </form>
        </div>
      </div>
    </div>;
  }
}

ResetPassword.propTypes = {
  resetPassword: PropTypes.func,
  params: PropTypes.object
};

ResetPassword.contextTypes = {
  router: PropTypes.object
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({resetPassword: auth.actions.resetPassword}, dispatch);
}

export default connect(null, mapDispatchToProps)(ResetPassword);
