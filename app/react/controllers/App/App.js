import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import { Router, match, RoutingContext, RouteContext } from 'react-router'

import {events} from '../../utils/index'

import Helmet from 'react-helmet'
import UserWidget from '../Users/UserWidget'
import { Link } from 'react-router'
import './scss/App.scss'
import 'font-awesome/css/font-awesome.css'
import Upload from '../../components/Upload/Upload'

class App extends Component {

  static contextTypes = {getUser: PropTypes.func };

  constructor(props, context) {
    super(props);
    this.fetch = props.fetch || fetch;
    this.state = {user: context.getUser(), showsidebar: true};
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
  };

  renderChildren = () => {
    return React.Children.map(this.props.children, (child, index) => {
      return React.cloneElement(child, {user: this.state.user});
    });
  };

  toggleSidebar = () => {
    this.setState({showsidebar: !this.state.showsidebar});
  };

  render = () => {

    let upload;
    if(this.state.user){
      upload = <Upload/>
    }

    let sidebarClass = 'col-xs-4 col-sm-3 col-lg-2 sidebar';
    let contentsClass = 'col-xs-offset-4 col-sm-offset-3 col-lg-offset-2 col-xs-8 col-sm-9 col-lg-10 contents';

    if(!this.state.showsidebar) {
      sidebarClass += ' sidebar-hidden';
      contentsClass = 'col-xs-12 contents no-sidebar';
    }

    return (
      <div>
        <Helmet
          titleTemplate='Uwazi - %s'
          meta={[
            {'char-set': 'utf-8'},
            {'name': 'description', 'content': 'Uwazi docs'}
          ]}
        />

        <nav className="nav navbar-nav navbar-default navbar-fixed-top">
          <div className="navbar-header">
            <Link to='/' className="navbar-brand">UwaziDocs</Link>
          </div>
          <div className="container-fluid">
           <div id="navbar" className="navbar-collapse collapse">

             <form className="navbar-form navbar-left">
              <div className="form-group">
                <input type="text" placeholder="Search" className="form-control" />
              </div>
              <button type="submit" className="btn btn-sm btn-transparent"><i className="fa fa-search"></i></button>
            </form>

              {upload}
              <UserWidget user={ this.state.user } />
           </div>
       </div>
     </nav>
        <div className='container-fluid contents-wrapper'>
          <div className="row">
            <div className={sidebarClass}>
              <ul className="nav nav-sidebar">
                <li><a onClick={this.toggleSidebar}><i className="fa fa-bars"></i></a></li>
                <li><Link to='/'><i className="fa fa-home"></i><span>Home</span></Link></li>
                <li><Link to='/template'><i className="fa fa-tag"></i><span>Metadata</span> templates</Link></li>
                <li><Link to='/uploads'><i className="fa fa-cloud-upload"></i><span>Uploads</span></Link></li>
              </ul>
            </div>
            <div className={contentsClass}>
              {this.renderChildren()}
            </div>
          </div>
        </div>
      </div>
    )
  };
}

export default App;
