import React, { Component, PropTypes, Children } from 'react'
import { isClient } from '../utils'

class Provider extends Component {

  static childContextTypes = {
    getInitialData: PropTypes.func
  }

  constructor(props){
    super(props)
    this.data = isClient && window.__initialData__ ? window.__initialData__ : props.initialData;
  }

  getChildContext() {
    return {
      getInitialData: ::this.getInitialData
    };
  }

  getInitialData() {
      let data = this.data;
      this.data = undefined;
      return data;
  }

  render() {
    let { children } = this.props;
    return Children.only(children);
  }
}

export default Provider;
