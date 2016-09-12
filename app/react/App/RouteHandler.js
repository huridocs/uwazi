import {Component, PropTypes} from 'react';
import JSONUtils from 'shared/JSONUtils';

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

  constructor(props) {
    super(props);

    if (!this.isRenderedFromServer() && this.setReduxState) {
      this.getClientState(this.props);
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
  params: PropTypes.object
};

export default RouteHandler;
