import React, { Component, PropTypes } from 'react'
import wrap from 'wrap-range-text'
import ReferenceForm from './ReferenceForm'
import TextRange from 'batarange'
import { browserHistory } from 'react-router'

class Document extends Component {

  constructor (props) {
    super(props);
    this.state = {};
  }

  unwrapFakeSelection = () => {
    if(this.fakeSelection){
      this.fakeSelection.unwrap();
    }
  }

  //
  handleClick = (e) => {

    let ref = e.target.getAttribute('ref');
    if(ref){
      let reference = this.props.references.find(reference => reference.value._id == ref);
      browserHistory.push('/document/'+reference.value.targetDocument);
    }

  }
  //

  textSelectionHandler = () => {
    this.unwrapFakeSelection();

    if(window.getSelection().toString() === ''){
      this.modal.hide();
      return this.setState({showReferenceLink: false});
    }
    this.onTextSelected();
  }

  onTextSelected = () => {
    let range = window.getSelection().getRangeAt(0);
    this.serializedRange = TextRange.serialize(range, this.contentContainer);
    this.simulateSelection(range);
    this.setState({showReferenceLink: true});
  }

  createReference = () => {
    this.props.onCreateReference(this.getReference());
  }

  getReference = () => {
    let reference = this.modal.value();
    reference.sourceDocument = this.props.document._id;
    reference.sourceRange = this.serializedRange;
    return reference;
  }

  componentDidMount = () => {
      this.renderReferences();
  }

  componentDidUpdate = () => {
      this.renderReferences();
  }

  componentWillReceiveProps = (nextProps) => {
    if(nextProps.references != this.props.references) {
      this.referencesAlreadyRendered = false;
    }
  }

  renderReferences = () => {
    if(this.props.references && !this.referencesAlreadyRendered){
      this.props.references.forEach((reference) => {
        this.wrapReference(reference.value);
      });

      this.referencesAlreadyRendered = true;
    }
  }

  addReference = (reference) => {
    this.props.references.push(reference);
    this.wrapReference(reference.value);
  }

  wrapReference = (reference) => {
    let range = TextRange.restore(reference.sourceRange, this.contentContainer)
    let wrapper = document.createElement('span');
    if(reference.title){
      wrapper.setAttribute('title', reference.title);
    }

    wrapper.classList.add('reference');

    if(reference._id){
      wrapper.setAttribute('ref', reference._id);
    }

    wrap(wrapper, range);
  }

  simulateSelection = (range) => {
    let wrapper = document.createElement('span');
    wrapper.classList.add('fake-selection');
    this.fakeSelection = wrap(wrapper, range);
  }

  openModal = () => {
    this.modal.show();
    this.modal.search();
    this.setState({showReferenceLink: false});
  }

  closeModal = () => {
    this.unwrapFakeSelection();
    this.modal.hide();
  }

  render = () => {

    let display = 'none';
    if(this.state.showReferenceLink){
      display = 'block';
    };

    let textSelectionLinkStyles = {
      display: display
    };

    return (
      <div>
        <div className="ref-button btn-primary" style={textSelectionLinkStyles} onClick={this.openModal}><i className="fa fa-link"></i></div>
        <ReferenceForm ref={(ref) => this.modal = ref} onClose={this.closeModal} onSubmit={this.createReference}/>

        <div ref={(ref) => this.contentContainer = ref} onClick={this.handleClick} className="pages" onMouseUp={this.textSelectionHandler} onTouchEnd={this.textSelectionHandler}>
          {this.props.document.pages.map((page, index) => {
            let html = {__html: page}
            let id = index;
            return <div id={id} key={index} dangerouslySetInnerHTML={html} ></div>
          })}
        </div>

        {this.props.document.css.map((css, index) => {
          let html = {__html: css}
          return <style type="text/css" key={index} dangerouslySetInnerHTML={html}></style>
        })}
      </div>
    )
  };

}

export default Document;
