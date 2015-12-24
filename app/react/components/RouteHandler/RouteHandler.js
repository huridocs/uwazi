import React, { Component, PropTypes } from 'react'
import { isClient } from '../../utils'

class RouteHandler extends Component {

  static contextTypes = { getInitialData: PropTypes.func }

  static requestState(){
    return Promise.resolve({});
  }

  constructor(props, context){
    super(props);
    if(context.getInitialData){
      this.state = context.getInitialData();
    }

    // this if is not tested, it is here only for server side rendering to work correctly
    if(isClient) {
      this.client();
    }
  }

  client () {

    if(!window.__initialData__){
      this.constructor.requestState(this.props.params)
      .then((response) => {
        this.setState(response);
      });
    }

    if(window.__initialData__){
      this.state = window.__initialData__;
      window.__initialData__ = undefined;
    }
  }
}

export default RouteHandler;
