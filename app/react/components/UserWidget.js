import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import Helmet from 'react-helmet'

class UserWidget extends Component {

  render() {
    return (
      <div>
        {(() => {
          if(this.props.user){
            return <ul className="nav navbar-nav navbar-right">
                      <li><Link className="glyphicon glyphicon-user" to='/my_account'> {this.props.user.username}</Link></li>
                      <li><a href="/logout">Logout</a></li>
                    </ul>
          }
          else {
            return <ul className="nav navbar-nav navbar-right">
                     <li><Link to='/login'>Login</Link></li>
                   </ul>
          }
        })()}
      </div>
    )
  }
}

export default UserWidget;
