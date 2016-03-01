import React, { Component, PropTypes } from 'react'
import api from '../../utils/singleton_api'

class ReferenceForm extends Component {

  constructor (props) {
    super(props);
    this.state = {documents:[]};
  }

  submit = (e) => {
    e.preventDefault();
    this.props.onSubmit();
  }

  value = () => {
    let value = {
      title: this.title.value,
      targetDocument: this.state.documentSelected
    };

    return value;
  }

  search = (e) => {
    if(e){ e.preventDefault(); }

    return api.get('documents/search?searchTerm='+this.searchField.value)
    .then((response) => {
      let documents = response.json;
      this.setState({documents: documents});
      if(documents.length){
        this.selectDocument(documents[0]._id);
      }
    });

  };

  show = () => {
    this.setState({show:true});
  };

  hide = () => {
    this.setState({show:false});
  };

  selectDocument = (documentId) => {
    this.setState({documentSelected: documentId});
  };

  onClose = () => {
    this.props.onClose();
  };

  render = () => {

    let className = 'ref-modal';

    if(!this.state.show){
      className +=' hidden';
    }

    return (
      <div className={className} ref={(ref) => this.modalElement = ref}>
        <div className="ref-modal-title">Create document reference</div>
        <a className="ref-modal-close" href="#" onClick={this.onClose}><i className="fa fa-close"></i></a>
        <div className="row">
          <div className="col-sm-6">
            <form onSubmit={this.search} className="ref-modal-search">
              <div>
                <input type="text" ref={(ref) => this.searchField = ref} placeholder="Search document to link" />
              </div>
              &nbsp;
              <button type="submit" className="btn btn-primary"><i className="fa fa-search"></i> </button>
            </form>
            <ul className="ref-modal-documents">
            {this.state.documents.map((document, index) => {
              let className = '';
              if(document._id == this.state.documentSelected){
                className = 'selected';
              }

              return <li onClick={this.selectDocument.bind(this, document._id)} className={className} key={index}>{document.title}</li>;
            })}
            </ul>
          </div>
          <div className="col-sm-6">
          <form onSubmit={this.submit} className="ref-modal-link">
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
              <label htmlFor="linktitle">Link title</label>
              <input ref={(ref) => this.title = ref} type="text" className="form-control" id="linktitle" />
            </div>
            <div className="form-group">
              <label htmlFor="linktype">Link type</label>
              <select className="form-control" id="linktype">
                <option>Normal link</option>
              </select>
            </div>
            </form>
            <button onClick={this.submit} className="btn btn-primary"><i className="fa fa-link"></i> Create reference</button>
          </div>
        </div>
      </div>
    )
  };

}

export default ReferenceForm;
