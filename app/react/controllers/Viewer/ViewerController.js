import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import Menu from '../App/Menu.js'
import api from '../../utils/singleton_api'
import RouteHandler from '../App/RouteHandler'
import './scss/viewer.scss'
import LogoIcon from '../../components/Logo/LogoIcon.js'

import wrap from 'wrap-range-text'
import TextRange from 'batarange'


class ViewerController extends RouteHandler {

  static requestState(params = {}, api){
    return api.get('documents?_id='+params.documentId)
    .then((response) => {
      return response.json.rows[0];
    });
  };

  static emptyState(){
    return {value:{pages:[], css:[]}, showmenu: false, showpanel:false, showReferenceLink: false, textSelectedTop: 0};
  };

  toggleMenu = () => {this.setState({showmenu: !this.state.showmenu})};
  togglePanel = () => {this.setState({showpanel: !this.state.showpanel})};

  closeMenu = () => {this.setState({showmenu: false})};

  textSelection = () => {
    //extract direct reference to window from here ?
    if(window.getSelection().toString() === ''){
      return this.setState({showReferenceLink: false, openModal: false});
    }

    let range = window.getSelection().getRangeAt(0);
    let top = range.getClientRects()[0].top + this.pagesContainer.scrollTop-60
    this.setState({showReferenceLink: true, textSelectedTop: top});
  };

  openModal = () => {
    this.setState({showReferenceLink: false, openModal:true});
  };

  closeModal = () => {
    this.setState({openModal:false});
  };

  createReference = () => {
    let reference = TextRange.getSelected(this.contentContainer);
    reference.sourceDocument = this.state.value.id;
    return api.post('references', reference);

    //let wrapper = document.createElement('span');
    //wrapper.classList.add('reference');
    //wrap(wrapper, this.range);
    //this.closeModal();
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
    if(this.state.showReferenceLink){
      display = "block";
    };

    let textSelectionLinkStyles = {
      display: display,
      top: this.state.textSelectedTop
    };

    let displayModal = "none";
    if(this.state.openModal){
      displayModal = "block";
    };

    let modalStyles = {
      display: displayModal,
      top: this.state.textSelectedTop,
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
                <div className="ref-button btn-primary" style={textSelectionLinkStyles} onClick={this.openModal}><i className="fa fa-link"></i></div>

                <div className="ref-modal" style={modalStyles}>
                  <div className="ref-modal-title">Create document reference</div>
                  <a className="ref-modal-close" href="#" onClick={this.closeModal}><i className="fa fa-close"></i></a>
                  <div className="row">
                    <div className="col-sm-6">
                      <form className="ref-modal-search">
                        <div>
                          <input type="text" placeholder="Search document to link" />
                        </div>
                        &nbsp;
                        <button type="submit" className="btn btn-primary"><i className="fa fa-search"></i> </button>
                      </form>
                      <ul className="ref-modal-documents">
                        <li>Constitutive act of the african union</li>
                        <li>African Charter of Human Rights</li>
                        <li>African Charter of Human Rights and people's rights</li>
                        <li>African Charter of Human Rights and Welfare of the Child</li>
                        <li>Amended SADC Teatry</li>
                      </ul>
                    </div>
                    <div className="col-sm-6">
                    <form className="ref-modal-link">
                      <div className="form-group">
                        <div className="link-to-label">Link to</div>
                        <label className="radio-inline">
                          <input type="radio" name="linkto" value="entire" /> Entire document
                        </label>
                        <label className="radio-inline">
                          <input type="radio" name="linkto" value="part" /> Part of document
                        </label>
                      </div>
                      <div className="form-group">
                        <label for="linktitle">Link title</label>
                        <input type="text" className="form-control" id="linktitle" />
                      </div>
                      <div className="form-group">
                        <label for="linktype">Link type</label>
                        <select className="form-control" id="linktype">
                          <option>Normal link</option>
                        </select>
                      </div>
                      </form>
                      <a className="btn btn-primary" href="#" onClick={this.createReference}><i className="fa fa-link"></i> Create reference</a>
                    </div>
                  </div>
                </div>

                <div className="pages" ref={(ref) => this.contentContainer = ref} onMouseUp={this.textSelection}>
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
                <div className="document-metadata">
                  <h1>003/12 Peter Joseph Chacha v The United Republic ofTanzania</h1>
                  <h2 className="toc">Table of contents</h2>
                  <ul>
                    <li>
                      <a href="#">Summary of alledged facts</a>
                      <ul>
                        <li><a href="#">Complaints submission of admisibility</a></li>
                        <li><a href="#">The african comitee analisys</a></li>
                      </ul>
                    </li>
                    <li><a href="#">Decission on admissibility</a></li>
                    <li><a href="#">The complaint</a></li>
                  </ul>
                  <h2 className="metadata">Document properties (metadata)</h2>
                  <table>
                    <tbody>
                      <tr>
                        <td>Country</td>
                        <td>Kenya</td>
                      </tr>
                      <tr>
                        <td>Date</td>
                        <td>09/10/2015</td>
                      </tr>
                      <tr>
                        <td>Language</td>
                        <td>EN - ES</td>
                      </tr>
                      <tr>
                        <td>Type</td>
                        <td>Decission</td>
                      </tr>
                      <tr>
                        <td>Mechanism</td>
                        <td>African Comittee of Experts on the Rights and Welfare of the Child</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
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
