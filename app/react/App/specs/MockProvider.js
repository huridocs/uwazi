import PropTypes from 'prop-types';
import {Component, Children} from 'react';

class MockProvider extends Component {

  getChildContext() {
    let props = this.props;
    return {
      getInitialData: function () {
        return props.initialData;
      },
      isRenderedFromServer: function () {
        return false;
      },
      getUser: function () {
        return props.user;
      },
      router: props.router
    };
  }

  render() {
    let {children} = this.props;
    return Children.only(children);
  }
}

MockProvider.childContextTypes = {
  getInitialData: PropTypes.func,
  isRenderedFromServer: PropTypes.func,
  getUser: PropTypes.func,
  router: PropTypes.object
};

MockProvider.propTypes = {
  children: PropTypes.object
};

export default MockProvider;
