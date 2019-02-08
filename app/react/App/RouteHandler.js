import { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { I18NUtils } from 'app/I18N';
import { actions } from 'app/BasicReducer';
import JSONUtils from 'shared/JSONUtils';
import api from 'app/utils/api';

class RouteHandler extends Component {
  static requestState() {
    return Promise.resolve({});
  }

  setReduxState() {} //eslint-disable-line
  emptyState() {} //eslint-disable-line

  static renderTools() {}

  isRenderedFromServer() {
    const result = RouteHandler.renderedFromServer;
    RouteHandler.renderedFromServer = false;
    return result;
  }

  setLocale(locale) {
    if (locale) {
      moment.locale(locale);
      api.locale(locale);
      this.setStateLocale(locale);
    }
  }

  getLocale(props) {
    if (this.context.store && this.context.store.getState) {
      const { languages } = this.context.store.getState().settings.collection.toJS();
      return I18NUtils.getLocale(props.params.lang, languages);
    }

    return null;
  }

  setStateLocale(locale) {
    this.context.store.dispatch(actions.set('locale', locale));
    I18NUtils.saveLocale(locale);
  }

  constructor(props, context) {
    super(props, context);

    //test ?
    const locale = this.getLocale(props);
    this.setLocale(locale);
    //test ?
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
    if (this.context.store && this.context.store.getState) {
      state = this.context.store.getState();
    }

    this.constructor.requestState(props.params, query, state)
    .then((response) => {
      this.setReduxState(response);
    });
  }

  urlHasChanged(props) {
    const { params = {}, routes = [] } = props;
    const sameParams = Object.keys(params).reduce((memo, key) => memo && props.params[key] === this.props.params[key], true);
    const sameAmountOfparams = Object.keys(params).length === Object.keys(this.props.params).length;
    const currentPath = this.props.routes.reduce((path, r) => path + r.path, '');
    const newPath = routes.reduce((path, r) => path + r.path, '');
    const samePath = currentPath === newPath;
    return !sameParams || !sameAmountOfparams || !samePath;
  }

  componentWillReceiveProps(props) {
    if (this.urlHasChanged(props)) {
      this.emptyState();
      const locale = this.getLocale(props);
      this.setLocale(locale);
      this.getClientState(props);
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
