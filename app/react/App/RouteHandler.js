/** @format */

import { I18NUtils } from 'app/I18N';
import { isClient } from 'app/utils';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const getLocale = ({ store }) => store.getState().locale;

const setLocale = locale => {
  moment.locale(locale);
  api.locale(locale);
  I18NUtils.saveLocale(locale);
};

class RouteHandler extends Component {
  static async requestState(_requestParams, _state) {
    return new Promise((resolve, _reject) => {
      resolve([]);
    });
  }

  emptyState() {} //eslint-disable-line

  //eslint-disable-next-line
  isRenderedFromServer() {
    const result = RouteHandler.renderedFromServer;
    RouteHandler.renderedFromServer = false;
    return result;
  }

  constructor(props, context) {
    super(props, context);
    setLocale(getLocale(context));
    this.state = {};
    if ((!this.isRenderedFromServer() || props.location?.state?.isClient) && isClient) {
      this.getClientState(this.props).catch(ex => {
        // used in inherited types
        // eslint-disable-next-line react/no-unused-state
        this.setState({ loadingError: ex });
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.urlHasChanged(prevProps)) {
      this.emptyState();
      this.getClientState(this.props);
    }
  }

  async getClientState(props) {
    let query;
    const { lang, ...routeParams } = props.params;
    if (props.location) {
      const params = new URLSearchParams(props.location.search);
      query = Object.fromEntries(params.entries());
    }

    const { store = { getState: () => {} } } = this.context;

    const headers = {};
    const requestParams = new RequestParams({ ...query, ...routeParams }, headers);
    const actions = await this.constructor.requestState(requestParams, store.getState());

    actions.forEach(action => {
      store.dispatch(action);
    });
  }

  urlHasChanged(prevProps) {
    const { params: nextParams = {}, matches: nextRoutes = [] } = prevProps;
    const { params, matches: routes } = this.props;

    const sameParams = Object.keys(nextParams).reduce(
      (memo, key) => memo && prevProps.params[key] === params[key],
      true
    );
    const sameAmountOfparams = Object.keys(nextParams).length === Object.keys(params).length;
    const currentPath = routes.reduce((path, r) => path + r.path, '');
    const newPath = nextRoutes.reduce((path, r) => path + r.path, '');
    const samePath = currentPath === newPath;
    return !sameParams || !sameAmountOfparams || !samePath;
  }

  render() {
    return <div>{false}</div>;
  }
}

RouteHandler.renderedFromServer = true;

RouteHandler.defaultProps = {
  params: {},
};

RouteHandler.contextTypes = {
  getInitialData: PropTypes.func,
  isRenderedFromServer: PropTypes.func,
  router: PropTypes.object,
  store: PropTypes.object,
};

RouteHandler.propTypes = {
  params: PropTypes.object,
  routes: PropTypes.array,
  location: PropTypes.object,
  matches: PropTypes.array,
};

export default RouteHandler;
