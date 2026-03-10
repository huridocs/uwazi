import { Component, Children } from 'react';
import PropTypes from 'prop-types';

import { isClient } from 'app/utils';

class CustomProvider extends Component {
  constructor(props) {
    super(props);
    this.data = isClient && window.__reduxData__ ? window.__reduxData__ : props.initialData;
    this.renderedFromServer = true;
    this.user = isClient && window.__user__ ? window.__user__ : props.user;
  }

  getChildContext() {
    return {
      getInitialData: this.getInitialData.bind(this),
      isRenderedFromServer: this.isRenderedFromServer.bind(this),
      getUser: this.getUser.bind(this),
      language: this.props.language,
    };
  }

  getUser() {
    return this.user;
  }

  isRenderedFromServer() {
    const { renderedFromServer } = this;
    this.renderedFromServer = false;
    return renderedFromServer;
  }

  getInitialData() {
    const { data } = this;
    delete this.data;
    return data;
  }

  render() {
    const { children } = this.props;
    return Children.only(children);
  }
}

CustomProvider.propTypes = {
  user: PropTypes.object,
  children: PropTypes.object,
  initialData: PropTypes.object,
  language: PropTypes.string,
};

CustomProvider.childContextTypes = {
  getInitialData: PropTypes.func,
  isRenderedFromServer: PropTypes.func,
  getUser: PropTypes.func,
  language: PropTypes.string,
};

export default CustomProvider;
