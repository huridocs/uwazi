import PropTypes from 'prop-types';
import {Component} from 'react';
import JSONUtils from 'shared/JSONUtils';
import {actions} from 'app/BasicReducer';
import {I18NUtils} from 'app/I18N';
import api from 'app/utils/api';
import moment from 'moment';

class RouteHandler extends Component {

  static requestState() {
    return Promise.resolve({});
  }

  emptyState() {
  }

  static renderTools() {}

  setReduxState() {}

  isRenderedFromServer() {
    let result = RouteHandler.renderedFromServer;
    RouteHandler.renderedFromServer = false;
    return result;
  }

  setLocale(props) {
    let locale = this.getLocale(props);
    this.setApiLocale(locale);
    this.setStateLocale(locale);
  }

  getLocale(props) {
    if (this.context.store && this.context.store.getState) {
      let languages = this.context.store.getState().settings.collection.toJS().languages;
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
    let locale = this.getLocale(props);
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

  componentWillReceiveProps(props) {
    if (props.params !== this.props.params) {
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
