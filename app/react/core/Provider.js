import React, { Component, PropTypes, Children } from 'react'
import { isClient } from '../utils'

class Provider extends Component {

  static childContextTypes = {
    getInitialData: PropTypes.func,
    getUser: PropTypes.func
  };

  constructor(props){
    super(props)
    this.data = isClient && window.__initialData__ ? window.__initialData__ : props.initialData;
    this.user = isClient && window.__user__ ? window.__user__ : props.user;
  }

  getChildContext() {
    return {
      getInitialData: ::this.getInitialData,
      getUser: ::this.getUser
    };
  };

  getUser() {
    return this.user;
  };

  getInitialData() {
      let data = this.data;
      this.data = undefined;
      return data;
  };

  render() {
    let { children } = this.props;
    return Children.only(children);
  };
}

export default Provider;
