import React, { Component, PropTypes } from 'react'
import api from '../../utils/api'
import RouteHandler from '../App/RouteHandler'

class ViewerController extends RouteHandler {

  static requestState(params = {}){
    return api.get('documents?_id='+params.documentId)
    .then((response) => {
      return response.json.rows[0];
    });
  };

  static emptyState(){
    return {value:{pages:[], css:[]}};
  };

  constructor(props, context){
    super(props, context);
    this.state = {value:{pages:[], css:[]}};
  };

  render = () => {
    let pageStyles = {height:'1120px', width: '792px'}
    return (
      <div>
        <div>
          {this.state.value.pages.map((page, index) => {
            let html = {__html: page}
            let id = 'pf'+index;
            return <div id={id} key={index} dangerouslySetInnerHTML={html} ></div>
          })}
        </div>
          {this.state.value.css.map((css, index) => {
            let html = {__html: css}
            return <style type="text/css" key={index} dangerouslySetInnerHTML={html}></style>
          })}
      </div>
    )
  };

}

export default ViewerController;
