import React from 'react';
import Helmet from 'react-helmet';
import Alert from '../../../components/Elements/Alert';

export default function () {
  return (
    <div className="row">
      <Helmet title="My account" />
      <h1>{this.props.user.username}</h1>
      <hr/>
      <h2>Update password</h2>
      <div className="col-xs-4">
        <Alert message={this.state.feedback.message} type={this.state.feedback.type} />
        <form onSubmit={this.submit.bind(this)}>
          <div className="form-group">
            <label htmlFor="password">New password</label>
            <input type="password" className="form-control" name="password" id="password"
            value={this.state.password}
            onChange={this.passwordChange.bind(this)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="repeatPassword">Repeat password</label>
            <input type="password" className="form-control" name="repeatPassword" id="repeatPassword"
            value={this.state.repeatPassword}
            onChange={this.repeatPasswordChange.bind(this)}
            />
          </div>
          <button type="submit" className="btn btn-default btn-primary">Change</button>
        </form>
      </div>
    </div>
  );
}
