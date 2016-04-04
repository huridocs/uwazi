import React from 'react';
import API from '../../utils/singleton_api';
import RouteHandler from '../App/RouteHandler';
import {events} from '../../utils';
import SelectField from '../../components/Form/fields/SelectField';
import TextareaField from '../../components/Form/fields/TextareaField';
import RoundedProgressBar from '../../components/Elements/RoundedProgressBar';
import Form from '../../components/Form/Form';
import Helmet from 'react-helmet';
import Upload from '../../components/Upload/Upload';
import {Link} from 'react-router';
import './scss/upload.scss';

class Uploads extends RouteHandler {

  componentDidMount() {
    events.on('newDocument', this.newDoc.bind(this));
    events.on('uploadProgress', this.uploadProgress.bind(this));
    events.on('uploadEnd', this.uploadEnd.bind(this));
  }

  componentWillUnmount() {
    events.off('newDocument', this.newDoc.bind(this));
    events.off('uploadProgress', this.uploadProgress.bind(this));
    events.off('uploadEnd', this.uploadEnd.bind(this));
  }

  newDoc(doc) {
    this.state.documents.unshift(doc);
    this.setState({documents: this.state.documents});
  }

  uploadProgress(id, percent) {
    for (let doc of this.state.documents) {
      if (doc.id === id) {
        doc.progress = percent;
        break;
      }
    }
    this.setState({documents: this.state.documents});
  }

  uploadEnd(id, file) {
    for (let doc of this.state.documents) {
      if (doc.id === id) {
        doc.progress = null;
        doc.value.file = file;
        break;
      }
    }
    this.setState({documents: this.state.documents});
  }

  static emptyState() {
    return {documents: [], templates: [], template: {properties: []}, showForm: false};
  }

  static requestState(params = {}, api) {
    return Promise.all([
      api.get('uploads'),
      api.get('templates')
    ])
    .then((responses) => {
      let documents = responses[0].json.rows;
      let templates = responses[1].json.rows;
      return {documents: documents, templates: templates};
    });
  }

  templateChanged() {
    let foundTemplate = this.state.templates.find((template) => {
      return template._id === this.templateField.value();
    });

    foundTemplate.properties = foundTemplate.properties || [];

    foundTemplate.properties = foundTemplate.properties || [];
    this.setState({template: foundTemplate});
  }

  editDocument(document) {
    if (!document.value.template) {
      document.value.template = this.state.templates[0]._id;
    }

    let foundTemplate = this.state.templates.find((template) => {
      return template._id === document.value.template;
    });

    this.setState({documentBeingEdited: document, template: foundTemplate});
  }

  deleteDocument(doc) {
    return API.delete('documents', {_id: doc.value._id, _rev: doc.value._rev})
    .then(() => {
      return API.get('documents');
    })
    .then((response) => {
      this.setState({documents: response.json.rows});
    });
  }

  cancelEdit() {
    this.setState({documentBeingEdited: null});
  }

  saveDocument() {
    let document = this.state.documentBeingEdited.value;
    document.template = this.templateField.value();
    document.title = this.titleField.value();
    document.metadata = this.form.value();
    return API.post('documents', document)
    .then(() => {
      events.emit('alert', 'success', 'Document updated.');
    });
  }

  moveToLibrary() {
    let doc = this.state.documentBeingEdited.value;
    doc.published = true;
    return API.post('documents', doc)
    .then(() => {
      this.state.documents.splice(this.state.documents.indexOf(doc), 1);
      this.setState({documents: this.state.documents, documentBeingEdited: null});
      events.emit('alert', 'success', 'Document moved to library.');
    });
  }

  docFileValue(doc) {
    //if(doc.progress) {
      //return (<ProgressBar progress={doc.progress}/>);
    //}

    if (doc.value.file) {
      return <a href={doc.value.file.filename}>{doc.value.file.originalname}</a>;
    }

    return <span>File not found</span>;
  }

  render() {
    let options = this.state.templates.map((template) => {
      return {value: template._id, label: template.name};
    });

    let listClass = 'col-xs-12 col-sm-7 col-md-7 panels-layout__panel no-padding';
    let metadataClass = 'col-xs-12 col-sm-5 col-md-5 panels-layout__panel no-padding';

    if (this.state.documentBeingEdited) {
      metadataClass += ' active';
    } else {
      listClass += ' active';
    }


    return (
      <div>
        <Helmet title='Upload' />
        <div className="row panels-layout">
          <div className={listClass}>
            <div className="panel-content">
              <Upload/>
              <table className="table table-hover upload-documents">
                <tbody>
                  {this.state.documents.map((doc, index) => {
                    let selected = '';
                    if (this.state.documentBeingEdited === doc) {
                      selected = 'upload-documents-selected';
                    }

                    return <tr className={selected} onClick={this.editDocument.bind(this, doc)} key={index}>
                              <td><RoundedProgressBar progress={doc.progress}/></td>
                              <td>{doc.value.title}</td>
                            </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className={metadataClass}>
            <div className="panel-top-bar">
              <button onClick={this.cancelEdit.bind(this)} className="btn btn-default fa fa-angle-left" ></button>
            </div>
            <div className="panel-content">
              {(() => {
                if (this.state.documentBeingEdited) {
                  return (
                    <div className="metadata">
                      <TextareaField label="Title" value={this.state.documentBeingEdited.value.title}
                      ref={(ref) => this.titleField = ref}
                      options={options}
                      />
                      <SelectField label="Document type" value={this.state.documentBeingEdited.value.template}
                      ref={(ref) => this.templateField = ref}
                      options={options}
                      onChange={this.templateChanged.bind(this)}
                      />
                      <Form fields={this.state.template.properties} values={this.state.documentBeingEdited.value.metadata}
                      ref={(ref) => this.form = ref }
                      />
                      &nbsp;
                      <button className="btn btn-sm btn-default" onClick={this.saveDocument.bind(this)}>
                        <i className="fa fa-floppy-o"></i>
                        Save
                      </button>
                      &nbsp;
                      {(() => {
                        if (this.state.documentBeingEdited.value.processed) {
                          return (
                                  <button onClick={this.moveToLibrary.bind(this)} className="btn btn-sm btn-default">
                                    <i className="fa fa-folder-open-o"></i>
                                    Move to library
                                  </button>
                                 );
                        }
                      })()}
                      &nbsp;
                      {(() => {
                        if (this.state.documentBeingEdited.value.processed) {
                          let documentViewUrl = '/document/' + this.state.documentBeingEdited.id;
                          return (
                                  <Link className="btn btn-sm btn-default" to={documentViewUrl}>
                                    <i className="fa fa-external-link"></i>
                                    View document
                                  </Link>
                                 );
                        }
                      })()}
                      &nbsp;
                      <button
                      onClick={this.deleteDocument.bind(this, this.state.documentBeingEdited)}
                      className="btn btn-sm btn-default">
                        <i className="fa fa-trash"></i>
                        Delete
                      </button>
                    </div>
                  );
                }

                return (
                  <h4 className="text-center">Select a document.</h4>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export default Uploads;
