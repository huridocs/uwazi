import React, { Component, PropTypes } from 'react'
import request from 'superagent';
import api from '../../utils/api'
import RouteHandler from '../RouteHandler/RouteHandler'

class Library extends RouteHandler {

  static requestState(){
    return api.get('documents')
    .then((response) => {
      let documents = response.json.rows;
      return {
        documents: documents,
      };
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
          </tr>
        </thead>
        <tbody>
          {this.state.documents.map((document, index) => {
            return <tr key={index}>
                    <td>1</td>
                    <td>{document.value.title}</td>
                    <td>{document.value.author}</td>
                    <td>{document.value.category}</td>
                  </tr>
          })}
        </tbody>
      </table>
    )
  }

}

export default Library;
