import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import Menu from '../App/Menu.js'
import api from '../../utils/singleton_api'
import RouteHandler from '../App/RouteHandler'
import './scss/viewer.scss'
import LogoIcon from '../../components/Logo/LogoIcon.js'
import DocumentMetadata from '../../components/DocumentMetadata/DocumentMetadata.js'
import {events} from '../../utils/index'

import wrap from 'wrap-range-text'
import TextRange from 'batarange'
import ReferenceForm from '../../components/ReferenceForm/ReferenceForm'

class ViewerController extends RouteHandler {

  static requestState(params = {}, api){
    var document;
    return api.get('documents?_id='+params.documentId)
    .then((response) => {
      document = response.json.rows[0];
      return api.get('templates?key='+document.value.template);
    })
    .then((response) => {
      return {value: document.value, template: response.json.rows[0]};
    });
  };

  static emptyState(){
    return {
      value:{pages:[], css:[], metadata: {}},
      template: {value: {}},
      showmenu: false,
      showpanel:false,
      showReferenceLink: false,
      textSelectedTop: 0,
      documents: []
    };
  };

  toggleMenu = () => {this.setState({showmenu: !this.state.showmenu})};
  togglePanel = () => {this.setState({showpanel: !this.state.showpanel})};

  closeMenu = () => {this.setState({showmenu: false})};

  textSelection = () => {

    this.unwrapFakeSelection();

    //extract direct reference to window from here ?
    if(window.getSelection().toString() === ''){
      this.modal.hide();
      return this.setState({showReferenceLink: false});
    }

    let range = window.getSelection().getRangeAt(0);

    //
      let wrapper = document.createElement('span');
      wrapper.classList.add('fake-selection');
      this.fakeSelection = wrap(wrapper, this.range);
    //

    let top = range.getClientRects()[0].top + this.pagesContainer.scrollTop-60
    this.setState({showReferenceLink: true, textSelectedTop: top});
    this.selection = range;
  };

  openModal = () => {
    this.modal.search();
    this.modal.show();
    this.setState({showReferenceLink: false});
  };

  unwrapFakeSelection = () => {
    if(this.fakeSelection) {
      this.fakeSelection.unwrap();
      this.fakeSelection = undefined;
    }
  };

  closeModal = () => {
    this.modal.hide();
    this.unwrapFakeSelection();
  };

  createReference = () => {
    let reference = this.modal.value();
    reference.sourceDocument = this.state.value._id;
    reference.sourceRange = TextRange.serialize(this.selection, this.contentContainer);

    return api.post('references', reference)
    .then(() => {
      let wrapper = document.createElement('span');
      wrapper.classList.add('reference');
      wrap(wrapper, TextRange.restore(reference.sourceRange, this.contentContainer));
      events.emit('alert', 'success', 'Reference created.');
      this.closeModal();
    });
  };

  render = () => {
    if(!this.state.documents){
      this.state.documents = [];
    }
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

    //let modalStyles = {
      //top: this.state.textSelectedTop
    //};
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

                <ReferenceForm onClose={this.closeModal} onSubmit={this.createReference} ref={(ref) => this.modal = ref}/>

                <div className="pages" ref={(ref) => this.contentContainer = ref} onMouseUp={this.textSelection} onTouchEnd={this.textSelection}>
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
                <DocumentMetadata metadata={this.state.value.metadata} template={this.state.template}/>
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
