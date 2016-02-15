import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import Menu from '../App/Menu.js'
import api from '../../utils/singleton_api'
import RouteHandler from '../App/RouteHandler'
import './scss/viewer.scss'


class ViewerController extends RouteHandler {

  static requestState(params = {}, api){
    return api.get('documents?_id='+params.documentId)
    .then((response) => {
      return response.json.rows[0];
    });
  };

  static emptyState(){
    return {value:{pages:[], css:[]}, showmenu: false};
  };

  toggleMenu = () => {this.setState({showmenu: !this.state.showmenu})};

  closeMenu = () => {this.setState({showmenu: false})};

  render = () => {
    let menuClass = 'navbar-collapse collapse';

    if(this.state.showmenu) {
      menuClass += ' in';
    }

    return (
      <div className="viewer">
        <nav className="nav  navbar-default navbar-fixed-top">
          <div className="container-fluid">
            <div className="navbar-header">
              <Link to='/' className="navbar-brand">UwaziDocs</Link>
              <button onClick={this.toggleMenu} href="" type="button" className="navbar-toggle"><i className="fa fa-bars"/></button>
            </div>
            <div onClick={this.closeMenu} id="navbar" className={menuClass}>
              <Menu className="nav navbar-nav navbar-right" user={this.props.user}/>
            </div>
         </div>
        </nav>
        <div className='container-fluid contents-wrapper'>
          <div className="row panels-layout viewer__pages">
            <div className="col-xs-12 col-sm-8 panels-layout__panel pages no-padding active">
              {this.state.value.pages.map((page, index) => {
                let html = {__html: page}
                let id = 'pf'+index;
                return <div id={id} key={index} dangerouslySetInnerHTML={html} ></div>
              })}
            </div>
            <div className="col-xs-12 col-sm-4 panels-layout__panel no-padding">
              <h1>Metadata</h1>
            </div>
          </div>
            {this.state.value.css.map((css, index) => {
              let html = {__html: css}
              return <style type="text/css" key={index} dangerouslySetInnerHTML={html}></style>
            })}
        </div>
      </div>
    )
  };

}

export default ViewerController;
