import React, { Component, PropTypes } from 'react'
import wrap from 'wrap-range-text'
import ReferenceForm from '../ReferenceForm/ReferenceForm'
import TextRange from 'batarange'

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
  };

  componentDidUpdate = () => {
    this.renderReferences();
  };

  renderReferences = () => {
    if(this.props.references && !this.referencesAlreadyRendered){
      this.props.references.forEach((reference) => {
        this.wrapReference(reference.value);
      });

      this.referencesAlreadyRendered = true;
    }
  }

  wrapReference = (reference) => {
    let range = TextRange.restore(reference.sourceRange, this.contentContainer)
    let wrapper = document.createElement('span');
    if(reference.title){
      wrapper.setAttribute('title', reference.title);
    }
    wrapper.classList.add('reference');
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
      display: display,
      //top: this.state.textSelectedTop
    };

    return (
      <div>
        <div className="ref-button btn-primary" style={textSelectionLinkStyles} onClick={this.openModal}><i className="fa fa-link"></i></div>
        <ReferenceForm ref={(ref) => this.modal = ref} onClose={this.closeModal} onSubmit={this.createReference}/>

        <div ref={(ref) => this.contentContainer = ref} className="pages" onMouseUp={this.textSelectionHandler} onTouchEnd={this.textSelectionHandler}>
          {this.props.document.pages.map((page, index) => {
            let html = {__html: page}
            //let id = 'pf'+index;
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
