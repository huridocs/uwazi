import React, { Component, PropTypes } from 'react'
import api from '../../utils/api'
import RouteHandler from '../../core/RouteHandler'

class ViewerController extends RouteHandler {

  static requestState(params = {}){
    return api.get('documents?id='+params.documentId)
    .then((response) => {
      return response.json.rows[0];
    });
  };

  constructor(props, context){
    super(props, context);
  };

  render = () => {
    return (
      <div>
      </div>
    )
  };

}

export default ViewerController;
