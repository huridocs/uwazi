import PropTypes from 'prop-types';
import { Component, Children } from 'react';

class MockProvider extends Component {
  getChildContext() {
    const { props } = this;
    return {
      getInitialData() {
        return props.initialData;
      },
      isRenderedFromServer() {
        return false;
      },
      getUser() {
        return props.user;
      },
      router: props.router,
    };
  }

  render() {
    const { children } = this.props;
    return Children.only(children);
  }
}

MockProvider.childContextTypes = {
  getInitialData: PropTypes.func,
  isRenderedFromServer: PropTypes.func,
  getUser: PropTypes.func,
  router: PropTypes.object,
};

MockProvider.propTypes = {
  children: PropTypes.object,
};

export default MockProvider;
