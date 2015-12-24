import React, { Component, PropTypes, Children } from 'react'
import { isClient } from './utils'

class Provider extends Component {

  static childContextTypes = {
    getInitialData: PropTypes.func
  }

  getChildContext() {
    return {
      getInitialData: ::this.getInitialData
    };
  }

  getInitialData() {
      return this.props.initialData;
  }

  render() {
    let { children } = this.props;
    return Children.only(children);
  }
}

export default Provider;
