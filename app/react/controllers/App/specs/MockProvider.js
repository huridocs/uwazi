import React, { Component, PropTypes, Children } from 'react'

class MockProvider extends Component {

  static childContextTypes = {
    getInitialData: PropTypes.func,
    getUser: PropTypes.func,
    router: PropTypes.object
  };

  getChildContext() {
    let props = this.props;
    return {
      getInitialData: function(){return props.initialData},
      getUser: function(){return props.user},
      router: props.router
    };
  };

  render() {
    let { children } = this.props;
    return Children.only(children);
  };
}

export default MockProvider
