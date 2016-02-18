import fetch from 'isomorphic-fetch'
import React, { Component, PropTypes } from 'react'
import { Router, match, RoutingContext, RouteContext } from 'react-router'

import { Link } from 'react-router'
import 'bootstrap/dist/css/bootstrap.css'
import './scss/App.scss'
import 'font-awesome/css/font-awesome.css'
import Menu from './Menu.js'
import Library from '../Library/Library.js'
import LogoIcon from '../../components/Logo/LogoIcon.js'

class Layout extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {showmenu: false};
  }

  renderChildren = () => {
    if(React.Children.count(this.props.children)){
      return React.Children.map(this.props.children, (child, index) => {
        return React.cloneElement(child, {user: this.props.user});
      });
    }

    return (<Library user={this.props.user} />);
  };

  toggleMenu = () => {this.setState({showmenu: !this.state.showmenu})};

  closeMenu = () => {this.setState({showmenu: false})};


  render = () => {

    let menuClass = 'navbar-collapse collapse';

    if(this.state.showmenu) {
      menuClass += ' in';
    }

    let bodyClass = 'library';
    if(this.props.children) {
      bodyClass = this.props.children.props.route.path;
    }

    return (
      <div className={bodyClass}>
        <nav className="nav  navbar-default navbar-fixed-top">
          <div className="container-fluid">
            <div className="navbar-header">
              <Link to='/' className="navbar-brand"><LogoIcon/></Link>
              <button onClick={this.toggleMenu} href="" type="button" className="navbar-toggle"><i className="fa fa-bars"/></button>
            </div>
            <div onClick={this.closeMenu} id="navbar" className={menuClass}>
              <Menu className="nav navbar-nav navbar-right" user={this.props.user}/>
            </div>
         </div>
        </nav>
        <div  onClick={this.closeMenu} className='container-fluid contents-wrapper'>
            {this.renderChildren()}
        </div>
      </div>
    )
  };

}

export default Layout;
