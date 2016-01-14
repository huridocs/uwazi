import React, { Component, PropTypes } from 'react'
import request from 'superagent';
import api from '../../utils/api'
import RouteHandler from '../../core/RouteHandler'
import {events} from '../../utils'
import SelectField from '../Form/fields/SelectField'
import ProgressBar from '../Elements/ProgressBar'
import Form from '../Form/Form'

class Library extends RouteHandler {

  componentDidMount = () => {
    events.on('newDocument', this.newDoc);
    events.on('uploadProgress', this.uploadProgress);
    events.on('uploadEnd', this.uploadEnd);
  };

  componentWillUnmount = () => {
    events.off('newDocument', this.newDoc);
    events.off('uploadProgress', this.uploadProgress);
    events.off('uploadEnd', this.uploadEnd);
  };

  newDoc = (doc) => {
    this.state.documents.unshift(doc);
    this.setState({documents: this.state.documents});
  };

  uploadProgress = (id, percent) => {
    for(let doc of this.state.documents) {
      if(doc.id === id){
        doc.progress = percent;
        break;
      }
    }
    this.setState({documents: this.state.documents});
  };

  uploadEnd = (id, file) => {
    for(let doc of this.state.documents) {
      if(doc.id === id){
        doc.progress = undefined;
        doc.value.file = file;
        break;
      }
    }
    this.setState({documents: this.state.documents});
  };

  static emptyState(){
    return {documents: [], templates:[], template:{fields:[]}, showForm:false};
  };

  static requestState(){
    return Promise.all([
      api.get('documents'),
      api.get('templates')
    ])
    .then((responses) => {
      let documents = responses[0].json.rows;
      let templates = responses[1].json.rows;
      return {documents: documents, templates: templates};
    });
  };

  templateChanged = () => {
    let template = this.state.templates.find((template) => {
      return template.id == this.templateField.value();
    });

    template.fields = template.fields || [];

    template.value.fields = template.value.fields || [];
    this.setState({template:template.value});
  };

  editDocument = (document) => {
    if(!document.value.template){
      document.value.template = this.state.templates[0].id;
    }

    let template = this.state.templates.find((template) => {
      return template.id == document.value.template;
    });

    this.setState({documentBeingEdited: document, template: template.value});
  };

  cancelEdit = () => {
    this.setState({documentBeingEdited: undefined});
  };

  saveDocument = () => {
    let document = this.state.documentBeingEdited.value;
    document.template = this.templateField.value();
    document.metadata = this.form.value();
    return api.post('documents', document);
  };

  docFileValue = (doc) => {
    if(doc.progress) {
      return (<ProgressBar progress={doc.progress}/>);
    }

    if(doc.value.file) {
      return (<a href={doc.value.file.filename}>{doc.value.file.originalname}</a>);
    }

    return (<span>File not found</span>);
  };

  render = () => {

    let options = this.state.templates.map((template) => {
      return {value:template.id, label: template.value.name};
    });

    return (
      <div className="row">
        <div className="col-md-7">
          <table className="table table-striped table-hover ">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {this.state.documents.map((doc, index) => {

                return <tr onClick={this.editDocument.bind(this, doc)} key={index}>
                        <td>{index + 1}</td>
                        <td>{doc.value.title}</td>
                        <td>{doc.value.author}</td>
                        <td>{doc.value.category}</td>
                        <td>{this.docFileValue(doc)}</td>
                      </tr>
              })}
            </tbody>
          </table>
        </div>
        <div className="col-md-5">


          {(() => {
            if(this.state.documentBeingEdited){
              return (
                <div>
                  <SelectField label="Template" value={this.state.documentBeingEdited.value.template} ref={(ref) => {this.templateField = ref}} options={options} onChange={this.templateChanged} />
                  <Form fields={this.state.template.fields} values={this.state.documentBeingEdited.value.metadata}  ref={(ref) => this.form = ref }/>
                  <button onClick={this.cancelEdit}>Cancel</button>
                  <button onClick={this.saveDocument}>Save</button>
                </div>
              )
            }
          })()}

        </div>
      </div>
    )
  };

}

export default Library;
