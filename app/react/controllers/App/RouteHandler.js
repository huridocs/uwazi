import React, { Component, PropTypes } from 'react'
import { isClient } from '../../utils'
import api from '../../utils/singleton_api'

class RouteHandler extends Component {

  static contextTypes = { getInitialData: PropTypes.func, getUser: PropTypes.func };

  static requestState(){
    return Promise.resolve({});
  };

  static emptyState(){
    return {}
  };

  constructor(props, context){
    super(props);
    this.state = context.getInitialData();

    if(!this.state){
      this.state = this.constructor.emptyState();
      this.constructor.requestState(this.props.params, api)
      .then((response) => {
        this.setState(response);
      });
    }
  };
}

export default RouteHandler;
