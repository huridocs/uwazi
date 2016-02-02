import React, { Component, PropTypes } from 'react'
import request from 'superagent';
import api from '../../utils/singleton_api'
import RouteHandler from '../App/RouteHandler'
import {events} from '../../utils'
import SelectField from '../../components/Form/fields/SelectField'
import TextareaField from '../../components/Form/fields/TextareaField'
import RoundedProgressBar from '../../components/Elements/RoundedProgressBar'
import Form from '../../components/Form/Form'
import Helmet from 'react-helmet'
import { Link } from 'react-router'
import './scss/library.scss'

class Library extends RouteHandler {


  static emptyState(){
    return {documents: []};
  };

  static requestState(params = {}, api){
    return api.get('documents/search')
    .then((response) => {
      let documents = response.json;
      return {documents: documents};
    });
  };

  search = (e) => {
    e.preventDefault();

    return api.get('documents/search?searchTerm='+this.searchField.value)
    .then((response) => {
      let documents = response.json;
      this.setState({documents: documents});
    });
  };

  render = () => {

    return (
      <div>
        <Helmet title='Library' />
        <div className="row panels-layout">
          <div className="col-xs-12 col-sm-7 col-md-8 panels-layout__panel no-padding active">
            <form className="search-form form-inline" onSubmit={this.search}>
              <div className="form-group">
                <input className="form-control" placeholder="Search" ref={(ref) => this.searchField = ref}/>
                &nbsp;
                <button className="btn btn-default" type='submit'>Search</button>
              </div>
            </form>

            <table className="table table-hover upload-documents">
              <tbody>
                {this.state.documents.map((doc, index) => {
                  let selected = "";
                  if(this.state.documentBeingEdited === doc){
                    selected = "upload-documents-selected";
                  }

                  return <tr className={selected} key={index}>
                          <td><RoundedProgressBar progress={doc.progress}/></td>
                          <td>{doc.title}</td>
                          <td className="view">
                            {(() => {
                              if(doc.processed) {
                                let documentViewUrl = '/document/'+doc._id;
                                return (<Link to={documentViewUrl}>View document</Link>)
                              }
                              else {
                                return (<span>Processing document</span>)
                              }
                            })()}
                          </td>
                         </tr>
                })}
              </tbody>
            </table>
          </div>
          <div className="col-xs-12 col-sm-5 col-md-4 panels-layout__panel">
            <h4 className="text-center">Document metadata</h4>
          </div>
        </div>
      </div>
    )
  };

}

export default Library;
