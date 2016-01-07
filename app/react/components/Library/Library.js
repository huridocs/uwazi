import React, { Component, PropTypes } from 'react'
import request from 'superagent';
import api from '../../utils/api'
import RouteHandler from '../../core/RouteHandler'
import {events} from '../../utils'
import SelectField from '../Form/fields/SelectField'
import Form from '../Form/Form'

class Library extends RouteHandler {

  constructor(props, context){
    super(props, context);
    events.on('newDocument', this.updateList);
  }

  updateList = (doc) => {
    this.state.documents.push(doc);
    this.setState({documents: this.state.documents});
  }

  static emptyState(){
    return {documents: [], templates:[], template:{fields:[]}, showForm:false};
  }

  static requestState(){
    return Promise.all([
      api.get('documents'),
      api.get('templates')
    ])
    .then((responses) => {
      let documents = responses[0].json.rows;
      let templates = responses[1].json.rows;
      return {documents: documents, templates: templates, template: templates[0].value};
    });
  }

  //
  templateChanged = () => {
    let template = this.state.templates.find((template) => {
      return template.id == this.templateField.value();
    });

    template.fields = template.fields || [];

    template.value.fields = template.value.fields || [];
    this.setState({template:template.value});
  }
  //

  showForm = () => {
    this.setState({showForm:true});
  }

  render = () => {

    //
    let options = this.state.templates.map((template) => {
      return {value:template.id, label: template.value.name};
    });
    //

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
                return <tr onClick={this.showForm} key={index}>
                        <td>{index + 1}</td>
                        <td>{doc.value.title}</td>
                        <td>{doc.value.author}</td>
                        <td>{doc.value.category}</td>
                        <td><a href={doc.value.filepath}>{doc.value.filename}</a></td>
                      </tr>
              })}
            </tbody>
          </table>
        </div>
        <div className="col-md-5">


          {(() => {
            if(this.state.showForm){
              return (
                <div>
                  <SelectField label="Template" ref={(ref) => {this.templateField = ref}} options={options} onChange={this.templateChanged} />
                  <Form fields={this.state.template.fields} />
                </div>
              )
            }
          })()}

        </div>
      </div>
    )
  }

}

export default Library;
