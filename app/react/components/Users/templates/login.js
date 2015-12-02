import React, { Component, PropTypes } from 'react'
import Helmet from 'react-helmet'

export default function() {
  return(
    <div className="row">
      <Helmet title="Login" />
      <h1>Login</h1>
      <div className="col-xs-4 col-xs-offset-4">
      {(() => {
        if(this.state.error){
          return <p className="alert alert-warning">Invalid password or username</p>
        }
      })()}
        <form onSubmit={ this.submit }>
          <div className="form-group">
            <label htmlFor="username">Email address</label>
            <input type="text" className="form-control" name="username" id="username" value={ this.state.credentials.username } onChange={ this.user_change }/>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password"  className="form-control" name="password" id="password" value={ this.state.credentials.password } onChange={ this.password_change }/>
          </div>
          <button type="submit" className="btn btn-default btn-primary">Submit</button>
        </form>
      </div>
    </div>
  )
}
