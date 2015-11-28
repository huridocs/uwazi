import React, { Component, PropTypes } from 'react'
import Helmet from 'react-helmet'

export default function() {
  return(
    <div className="row">
      <Helmet title="My account" />
      <h1>My account</h1>
      <hr/>
      <h2>Update password</h2>
      <div className="col-xs-4">
      {(() => {
        if(this.state.error){
          return <p className="alert alert-warning">Passwords should match</p>
        }
      })()}
        <form onSubmit={ this.submit }>
          <div className="form-group">
            <label htmlFor="password">New password</label>
            <input type="password" className="form-control" name="password" id="password" value={ this.state.password } onChange={ this.password_change }/>
          </div>
          <div className="form-group">
            <label htmlFor="repeat_password">Repeat password</label>
            <input type="password"  className="form-control" name="repeat_password" id="repeat_password" value={ this.state.repeat_password } onChange={ this.repeat_password_change }/>
          </div>
          <button type="submit" className="btn btn-default btn-primary">Change</button>
        </form>
      </div>
    </div>
  )
}
