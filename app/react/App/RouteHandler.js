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

  emptyState() {
  }

  static renderTools() {}

  setReduxState() {}

  isRenderedFromServer() {
    const result = RouteHandler.renderedFromServer;
    RouteHandler.renderedFromServer = false;
    return result;
  }

  setLocale(props) {
    const locale = this.getLocale(props);
    if (locale) {
      this.setApiLocale(locale);
      this.setStateLocale(locale);
    }
  }

  getLocale(props) {
    if (this.context.store && this.context.store.getState) {
      const languages = this.context.store.getState().settings.collection.toJS().languages;
      return I18NUtils.getLocale(props.location.pathname, languages);
    }
  }

  setApiLocale(locale) {
    api.locale(locale);
  }

  setStateLocale(locale) {
    this.context.store.dispatch(actions.set('locale', locale));
    if (!I18NUtils.getCoockieLocale()) {
      I18NUtils.saveLocale(locale);
    }
  }

  constructor(props, context) {
    super(props, context);

    //test ?
    const locale = this.getLocale(props);
    moment.locale(locale);
    this.setApiLocale(locale);
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
    const { params = {} } = props;
    const sameParams = Object.keys(params).reduce((memo, key) => memo && props.params[key] === this.props.params[key], true);
    return !sameParams;
  }

  componentWillReceiveProps(props) {
    if (this.urlHasChanged(props)) {
      this.emptyState();
      this.setLocale(props);
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
  location: PropTypes.object
};

export default RouteHandler;
