import React, { Component, PropTypes } from 'react'
import request from 'superagent';
import api from '../../utils/api'
import RouteHandler from '../../core/RouteHandler'
import {events} from '../../utils'

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
    return {documents: []};
  }

  static requestState(){
    return api.get('documents')
    .then((response) => {
      let documents = response.json.rows;
      return {documents: documents};
    })
  }

  render = () => {
    return (
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
            return <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{doc.value.title}</td>
                    <td>{doc.value.author}</td>
                    <td>{doc.value.category}</td>
                    <td><a href={doc.value.filepath}>{doc.value.filename}</a></td>
                  </tr>
          })}
        </tbody>
      </table>
    )
  }

}

export default Library;
