import React, { Component, PropTypes } from 'react'
import request from 'superagent';
import api from '../../utils/api'
import RouteHandler from '../App/RouteHandler'
import {events} from '../../utils'
import SelectField from '../../components/Form/fields/SelectField'
import TextareaField from '../../components/Form/fields/TextareaField'
import RoundedProgressBar from '../../components/Elements/RoundedProgressBar'
import Form from '../../components/Form/Form'
import Helmet from 'react-helmet'
import { Link } from 'react-router'
import './scss/upload.scss'

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
    document.title = this.titleField.value();
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
      <div>
        <Helmet title='Upload' />
        <div className="row two-panel-layout">
          <div className="col-md-8 two-panel-layout-left no-padding">
            <table className="table table-hover upload-documents">
              <tbody>
                {this.state.documents.map((doc, index) => {
                  let selected = "";
                  if(this.state.documentBeingEdited === doc){
                    selected = "upload-documents-selected";
                  }

                  return <tr className={selected} onClick={this.editDocument.bind(this, doc)} key={index}>
                            <td><RoundedProgressBar progress={doc.progress}/></td>
                            <td>{doc.value.title}</td>
                            <td className="view">
                              {(() => {
                                if(doc.value.processed) {
                                  let documentViewUrl = '/document/'+doc.id;
                                  return (<Link to={documentViewUrl}>View document</Link>)
                                }
                                else {
                                  return (<span>Processing document</span>)
                                }
                              })()}
                            </td>
                            <td><button className="btn btn-transparent"><i className="fa fa-trash"></i></button></td>
                          </tr>
                })}
              </tbody>
            </table>
          </div>
          <div className="col-md-4 two-panel-layout-right">
            {(() => {
              if(this.state.documentBeingEdited){
                return (
                  <div>
                    <TextareaField label="Title" value={this.state.documentBeingEdited.value.title} ref={(ref) => {this.titleField = ref}} options={options} />
                    <SelectField label="Document type" value={this.state.documentBeingEdited.value.template} ref={(ref) => {this.templateField = ref}} options={options} onChange={this.templateChanged} />
                    <Form fields={this.state.template.fields} values={this.state.documentBeingEdited.value.metadata}  ref={(ref) => this.form = ref }/>
                    <button className="btn btn-default" onClick={this.cancelEdit}>Cancel</button>
                    &nbsp;
                    <button className="btn btn-primary" onClick={this.saveDocument}>Save</button>
                    &nbsp;
                    {(() => {
                      if(this.state.documentBeingEdited.value.processed) {
                        <button className="btn btn-primary">Move to library</button>
                      }
                    })()}
                  </div>
                )
              }else{
                return (
                  <h4 className="text-center">Select a document.</h4>
                )
              }
            })()}
          </div>
        </div>
      </div>
    )
  };

}

export default Library;
