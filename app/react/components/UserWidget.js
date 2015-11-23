import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import Helmet from 'react-helmet'
import {events} from '../utils/index'

class UserWidget extends Component {

  constructor(props) {
    super(props);
    this.state = {username:false};
    this.fetchUser();
    events.on('login', this.fetchUser);
  }

  fetchUser = () => {
    return fetch('/api/user', {method:'GET',
                 headers: {
                   'Accept': 'application/json',
                   'Content-Type': 'application/json'
                 },
                 credentials: 'same-origin'})
    .then((response) => response.json())
    .then((response) => this.setState({username: response.username}))
  }

  render() {
    return (
      <div>
        {(() => {
          if(this.state.username){
            return <ul className="nav navbar-nav navbar-right">
                      <li className="glyphicon glyphicon-user navbar-text"> {this.state.username}</li>
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
