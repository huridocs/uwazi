import { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { I18NUtils } from 'app/I18N';
import JSONUtils from 'shared/JSONUtils';
import api from 'app/utils/api';

const getLocale = ({ store }) => store.getState().locale;

const setLocale = (locale) => {
  moment.locale(locale);
  api.locale(locale);
  I18NUtils.saveLocale(locale);
};

class RouteHandler extends Component {
  static requestState() {
    return Promise.resolve({});
  }

  setReduxState() {} //eslint-disable-line
  emptyState() {} //eslint-disable-line

  static renderTools() {}

  isRenderedFromServer() { //eslint-disable-line
    const result = RouteHandler.renderedFromServer;
    RouteHandler.renderedFromServer = false;
    return result;
  }

  constructor(props, context) {
    super(props, context);
    setLocale(getLocale(context));
    if (!this.isRenderedFromServer() && this.setReduxState) {
      this.getClientState(this.props);
    }
  }

  getClientState(props) {
    let query;
    if (props.location) {
      query = JSONUtils.parseNested(props.location.query);
    }

    let state = {};

    const { store } = this.context;
    if (store && store.getState) {
      state = store.getState();
    }

    this.constructor.requestState(props.params, query, state)
    .then((response) => {
      this.setReduxState(response);
    });
  }

  urlHasChanged(nextProps) {
    const { params: nextParams = {}, routes: nextRoutes = [] } = nextProps;
    const { params, routes } = this.props;

    const sameParams = Object.keys(nextParams).reduce((memo, key) => memo && nextProps.params[key] === params[key], true);
    const sameAmountOfparams = Object.keys(nextParams).length === Object.keys(params).length;
    const currentPath = routes.reduce((path, r) => path + r.path, '');
    const newPath = nextRoutes.reduce((path, r) => path + r.path, '');
    const samePath = currentPath === newPath;
    return !sameParams || !sameAmountOfparams || !samePath;
  }

  componentWillReceiveProps(nextProps) {
    if (this.urlHasChanged(nextProps)) {
      this.emptyState();
      this.getClientState(nextProps);
    }
  }

  render() {
    return false;
  }
}

RouteHandler.renderedFromServer = true;

RouteHandler.contextTypes = {
  getInitialData: PropTypes.func,
  isRenderedFromServer: PropTypes.func,
  router: PropTypes.object,
  store: PropTypes.object
};

RouteHandler.propTypes = {
  params: PropTypes.object,
  routes: PropTypes.array,
  location: PropTypes.object
};

export default RouteHandler;
