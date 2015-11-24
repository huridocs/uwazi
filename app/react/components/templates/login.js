import React, { Component, PropTypes } from 'react'
import Helmet from 'react-helmet'

export default function() {
  return(
    <div className="row">
      <Helmet title="Login" />
      <h1>Login</h1>
      <div className="col-xs-4 col-xs-offset-4">
      {(() => {
        if(!this.state.succeed){
          return <p className="alert alert-warning">invalid password or username</p>
        }
      })()}
        <form onSubmit={ this.handle_submit }>
          <div className="form-group">
            <label htmlFor="exampleInputEmail1">Email address</label>
            <input type="text" className="form-control" name="username" value={ this.state.username } onChange={ this.user_change }/>
          </div>
          <div className="form-group">
            <label htmlFor="exampleInputPassword1">Password</label>
            <input type="password"  className="form-control" name="password" value={ this.state.password } onChange={ this.password_change }/>
          </div>
          <button type="submit" className="btn btn-default btn-primary">Submit</button>
        </form>
      </div>
    </div>
  )
}
