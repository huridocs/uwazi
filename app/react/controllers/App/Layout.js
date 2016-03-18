import React, {Component, PropTypes} from 'react';

import { Link } from 'react-router'
import 'bootstrap/dist/css/bootstrap.css'
import './scss/layout.scss'
import 'font-awesome/css/font-awesome.css'
import Menu from './Menu.js'
import Library from '../Library/Library.js'
import LogoIcon from '../../components/Logo/LogoIcon.js'

class Layout extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {showmenu: false};
  }

  renderChildren() {
    if (React.Children.count(this.props.children)) {
      return React.Children.map(this.props.children, (child) => {
        return React.cloneElement(child, {user: this.props.user});
      });
    }

    return <Library user={this.props.user} />;
  }

  toggleMenu() {
    this.setState({showmenu: !this.state.showmenu});
  }

  closeMenu() {
    this.setState({showmenu: false});
  }

  render() {

    let menuClass = 'col-md-5 col-sm-6';
    let menuToggleClass = "navbar-toggle ";

    if (this.state.showmenu) {
      menuClass += ' in';
      menuToggleClass += 'active';
    }

    let bodyClass = 'library';
    if (this.props.children) {
      bodyClass = this.props.children.props.route.path;
    }

    return (
      <div className={bodyClass}>
      <nav>
        <h1>Collection name</h1>
        <button onClick={this.toggleMenu.bind(this)} type="button" className={menuToggleClass}><i className="fa fa-bars"/></button>
        <ul>
          <li className="active"><i className="fa fa-question"></i>Library</li>
          <li><i className="fa fa-user"></i>Recently viewed</li>
          <li className="login"><i className="fa fa-power-off"></i>Login</li>
        </ul>
      </nav>
      <header>
        <div className="container-fluid">
          <div className="row">
            <i className="fa fa-filter"></i>
            <i className="fa fa-bars"></i>
            <h1 className="col-sm-3 col-md-3">Collection name</h1>
            <div className="col-sm-3 col-md-4">
              <div className="input-group">
                <span className="input-group-btn">
                  <button className="btn btn-default"><i className="fa fa-search"></i><i className="fa fa-close"></i></button></span>
                <input type="text" placeholder="Search in 39 documents" className="form-control"/>
                <div className="search-suggestions">
                  <p> <b>Africa</b> Legal Aid (on behalf of Isaac and Robert Banda) Gambia (The)<i className="fa fa-arrow-left"></i></p>
                  <p>149 96 <b>Africa</b> Sir Dawda K. Jawara Gambia (The)<i className="fa fa-arrow-left"></i></p>
                  <p>Democratic Republic of Congo Burundi, Rwanda, Uganda, <b>Africa</b><i className="fa fa-arrow-left"></i></p>
                  <p id="all-africa-documents" className="search-suggestions-all"><i className="fa fa-search"></i>See all documents for "africa"</p>
                </div>
              </div>
            </div>
            <div onClick={this.closeMenu.bind(this)} className={menuClass}>
              <Menu className="nav nav-pills" user={this.props.user}/>
            </div>
          </div>
        </div>
      </header>
        <div  onClick={this.closeMenu.bind(this)} className='container-fluid contents-wrapper'>
            {this.renderChildren.bind(this)}
        </div>
        <footer>
          <div className="container-fluid">
            <div className="row">
              <div className="col-sm-3">
                <h5> <i className="fa fa-heart-o"></i>What we do</h5>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque eveniet labore nihil.</p>
              </div>
              <div className="col-sm-3">
                <h5> <i className="fa fa-support"></i>Help center</h5>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque eveniet labore nihil.</p>
              </div>
              <div className="col-sm-3">
                <h5> <i className="fa fa-share-alt"></i>Connect with us</h5>
                <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Doloremque eveniet labore nihil.</p>
              </div>
              <div className="col-sm-3">
                <p>Powered with Uwazi.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

}

Layout.propTypes = {
  children: PropTypes.object,
  user: PropTypes.object
};

export default Layout;
