import {Component, PropTypes} from 'react';
import JSONUtils from 'shared/JSONUtils';
import Cookie from 'tiny-cookie';
import {isClient} from 'app/utils';
import {actions} from 'app/BasicReducer';

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

  getUrlLocale(path, languages = []) {
    return languages.reduce((locale, lang) => {
      let regexp = new RegExp(`^\/?${lang.key}\/|^\/?${lang.key}$`);
      if (path.match(regexp)) {
        return path.match(regexp)[0].replace(/\//g, '');
      }

      return locale;
    }, null);
  }

  getCoockieLocale() {
    if (isClient && Cookie.get('locale')) {
      return Cookie.get('locale');
    }
    return RouteHandler.locale;
  }

  getDefaultLocale(languages = []) {
    return (languages.find((language) => language.default) || {}).key;
  }

  constructor(props, context) {
    super(props, context);
    if (!this.isRenderedFromServer() && this.setReduxState) {
      this.getClientState(this.props);
    }

    if (context.store && context.store.getState) {
      let languages = context.store.getState().settings.collection.toJS().languages;
      let locale = this.getUrlLocale(props.location.pathname, languages) || this.getCoockieLocale() || this.getDefaultLocale(languages);
      context.store.dispatch(actions.set('locale', locale));
      if (!Cookie.get('locale')) {
        Cookie.set('locale', locale);
      }
    }
  }

  getClientState(props) {
    let query;
    if (props.location) {
      query = JSONUtils.parseNested(props.location.query);
    }
    this.constructor.requestState(props.params, query)
    .then((response) => {
      this.setReduxState(response);
    });
  }

  componentWillReceiveProps(props) {
    if (props.params !== this.props.params) {
      this.emptyState();
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
  getUser: PropTypes.func,
  router: PropTypes.object,
  store: PropTypes.object
};

RouteHandler.propTypes = {
  params: PropTypes.object,
  location: PropTypes.object
};

export default RouteHandler;
