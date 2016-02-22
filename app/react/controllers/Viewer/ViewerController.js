import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import Menu from '../App/Menu.js'
import api from '../../utils/singleton_api'
import RouteHandler from '../App/RouteHandler'
import './scss/viewer.scss'
import LogoIcon from '../../components/Logo/LogoIcon.js'
import wrap from 'wrap-range-text'


class ViewerController extends RouteHandler {

  static requestState(params = {}, api){
    return api.get('documents?_id='+params.documentId)
    .then((response) => {
      return response.json.rows[0];
    });
  };

  static emptyState(){
    return {value:{pages:[], css:[]}, showmenu: false, showpanel:false, textSelected: false, textSelectedTop: 0};
  };

  toggleMenu = () => {this.setState({showmenu: !this.state.showmenu})};
  togglePanel = () => {this.setState({showpanel: !this.state.showpanel})};

  closeMenu = () => {this.setState({showmenu: false})};

  textSelection = () => {
    if(window.getSelection().toString() === ''){
      return this.setState({textSelected: false, openModal: false});
    }

    let range = window.getSelection().getRangeAt(0);

    this.setState({textSelected: true, textSelectedTop: range.getClientRects()[0].top + this.pagesContainer.scrollTop-60});
  };

  openModal = () => {
    this.setState({textSelected: false, openModal:true});
  };

  closeModal = () => {
    this.setState({openModal:false});
  };

  createRef = () => {
    let wrapper = document.createElement('span');
    wrapper.classList.add('reference');
    wrap(wrapper, this.range);
    this.closeModal();
  };

  render = () => {
    let menuClass = 'navbar-collapse collapse';
    let menuToggleClass = "navbar-toggle ";

    if(this.state.showmenu) {
      menuClass += ' in';
      menuToggleClass += "active";
    }

    let viewerClass = "col-xs-12 col-sm-8 panels-layout__panel no-padding ";

    let panelClass = "col-xs-12 col-sm-4 panels-layout__panel no-padding "
    let panelToggleClass = "navbar-toggle ";

    if(this.state.showpanel) {
      panelClass += 'active';
      panelToggleClass += 'active';
    }
    else {
      viewerClass += 'active';
    }

    let display = "none";
    if(this.state.textSelected){
      display = "block";
    };

    let textSelectionLinkStyles = {
      position:"absolute",
      display: display,
      'zIndex': "9999",
      top: this.state.textSelectedTop
    };

    let displayModal = "none";
    if(this.state.openModal){
      displayModal = "block";
    };

    let modalStyles = {
      position:"absolute",
      display: displayModal,
      'zIndex': "9999",
      top: this.state.textSelectedTop,
      background:'red',
      width: '100%',
      height: '50px'
    };

    return (
      <div className="viewer">
        <nav className="nav  navbar-default navbar-fixed-top">
          <div className="container-fluid">
            <div className="navbar-header">
              <Link to='/' className="navbar-brand"><LogoIcon/></Link>
              <a href="#" className="go-back" onClick={this.props.history.goBack}><i className="fa fa-angle-left"></i><span> GO BACK</span></a>
              <button onClick={this.toggleMenu} href="" type="button" className={menuToggleClass}><i className="fa fa-bars"/></button>
              <button onClick={this.togglePanel} href="" type="button" className={panelToggleClass}><i className="fa fa-cog"/></button>
            </div>
            <ul className="nav navbar-nav navbar-tools">
              <li>
                <a href="#" className=""><i className="fa fa-bookmark-o"></i></a>
              </li>
              <li>
                <a href="#" className=""><i className="fa fa-search"></i></a>
              </li>
              <li>
                <a href="#" className=""><i className="glyphicon glyphicon-text-size"></i></a>
              </li>
              <li>
                <a href="#" className=""><i className="fa fa-cloud-download"></i></a>
              </li>
            </ul>
            <div onClick={this.closeMenu} id="navbar" className={menuClass}>
              <Menu className="nav navbar-nav navbar-right" user={this.props.user}/>
            </div>
         </div>
        </nav>
        <div className='container-fluid contents-wrapper'>
          <div className="row panels-layout viewer__pages">
            <div className={viewerClass}>
              <div className="panel-content" ref={(ref) => this.pagesContainer = ref}>
                <a href="#" style={textSelectionLinkStyles} onClick={this.openModal}>text selected</a>

                <div style={modalStyles}>
                  <a href="#" onClick={this.closeModal}>close</a>
                  <br/>MODAL !!
                  <a href="#" onClick={this.createRef}>OK</a>
                </div>

                <div className="pages" onMouseUp={this.textSelection}>
                  {this.state.value.pages.map((page, index) => {
                    let html = {__html: page}
                    let id = 'pf'+index;
                    return <div id={id} key={index} dangerouslySetInnerHTML={html} ></div>
                  })}
                </div>
              </div>
            </div>
            <div className={panelClass}>
              <div className="panel-content">
              <ul className="panel-tools">
                <li>
                  <a href="#" className=""><i className="fa fa-bookmark-o"></i></a>
                </li>
                <li>
                  <a href="#" className=""><i className="fa fa-search"></i></a>
                </li>
                <li>
                  <a href="#" className=""><i className="glyphicon glyphicon-text-size"></i></a>
                </li>
                <li>
                  <a href="#" className=""><i className="fa fa-cloud-download"></i></a>
                </li>
              </ul>
              </div>
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
