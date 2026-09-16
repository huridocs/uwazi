import { Component, Children, createContext, createElement } from 'react';
import PropTypes from 'prop-types';
import { isClient } from '#app/utils/index.js';

const AppProviderContext = createContext({
  getInitialData: () => undefined,
  isRenderedFromServer: () => false,
  getUser: () => undefined,
  language: undefined,
});

class CustomProvider extends Component {
  constructor(props) {
    super(props);
    this.data = isClient && window.__reduxData__ ? window.__reduxData__ : props.initialData;
    this.renderedFromServer = true;
    this.user =
      isClient && window.__atomStoreData__?.user !== undefined
        ? window.__atomStoreData__.user
        : props.user;
    this.getInitialData = this.getInitialData.bind(this);
    this.isRenderedFromServer = this.isRenderedFromServer.bind(this);
    this.getUser = this.getUser.bind(this);
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

  getContextValue() {
    const { language } = this.props;
    if (!this.providerContextValue || this.providerContextValue.language !== language) {
      this.providerContextValue = {
        getInitialData: this.getInitialData,
        isRenderedFromServer: this.isRenderedFromServer,
        getUser: this.getUser,
        language,
      };
    }
    return this.providerContextValue;
  }

  render() {
    return createElement(
      AppProviderContext.Provider,
      { value: this.getContextValue() },
      Children.only(this.props.children)
    );
  }
}

CustomProvider.propTypes = {
  user: PropTypes.object,
  children: PropTypes.object,
  initialData: PropTypes.object,
  language: PropTypes.string,
};

export { CustomProvider, AppProviderContext };
