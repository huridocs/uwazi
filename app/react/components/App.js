import fetch from 'isomorphic-fetch'
import React, { Component } from 'react'

import {events} from '../utils/index'

import Helmet from 'react-helmet'
import UserWidget from './UserWidget'
import { Link } from 'react-router'
import './scss/App.scss'

class App extends Component {

  constructor(props) {
    super(props);
    this.fetch = props.fetch || fetch;
    this.state = {user: {}};
    this.fetchUser();
    events.on('login', this.fetchUser);
  }

  fetchUser = () => {
    return this.fetch('/api/user', {method:'GET',
                 headers: {
                   'Accept': 'application/json',
                   'Content-Type': 'application/json'
                 },
                 credentials: 'same-origin'})
    .then((response) => response.json())
    .then((response) => {
      this.setState({user: response})
    })
  }

  renderChildren = () => {
    return React.Children.map(this.props.children, (child, index) => {
      return React.cloneElement(child, {user: this.state.user});
    });
  }

  render = () => {
    return (
      <div>
        <Helmet
          titleTemplate='Uwazi - %s'
          meta={[
            {'char-set': 'utf-8'},
            {'name': 'description', 'content': 'My super dooper dope app'}
          ]}
        />

        <nav className="nav navbar-nav navbar-default navbar-fixed-top">
          <div className="container-fluid">
           <div className="navbar-header">
             <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
               <span className="sr-only">Toggle navigation</span>
               <span className="icon-bar"></span>
               <span className="icon-bar"></span>
               <span className="icon-bar"></span>
             </button>
             <li><Link to='/' className="navbar-brand">Uwazidocs</Link></li>
           </div>
           <div id="navbar" className="navbar-collapse collapse">
             <ul className="nav navbar-nav">
              <li><Link to='/'>Home</Link></li>
              <li><Link to='/users'>Users</Link></li>
             </ul>
              <UserWidget user={ this.state.user } />
           </div>
       </div>
     </nav>
        <div className='container'>
          {this.renderChildren()}
        </div>
      </div>
    )
  }
}

export default App;
