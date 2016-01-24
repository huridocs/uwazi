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
import './scss/library.scss'

class Library extends RouteHandler {


  static emptyState(){
    return {documents: []};
  };

  static requestState(){
    return api.get('documents')
    .then((response) => {
      let documents = response.json.rows;
      return {documents: documents};
    });
  };

  render = () => {

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

                  return <tr className={selected} key={index}>
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
                         </tr>
                })}
              </tbody>
            </table>
          </div>
          <div className="col-md-4 two-panel-layout-right">
            <h4 className="text-center">Document metadata</h4>
          </div>
        </div>
      </div>
    )
  };

}

export default Library;
