import {Component, PropTypes} from 'react';
import api from '../../utils/api';

class RouteHandler extends Component {

  static requestState() {
    return Promise.resolve({});
  }

  static emptyState() {
    return {};
  }

  static renderTools() {}

  isRenderedFromServer() {
    let result = RouteHandler.renderedFromServer;
    RouteHandler.renderedFromServer = false;
    return result;
  }

  constructor(props, context) {
    super(props);

    if (!this.isRenderedFromServer() && this.setReduxState) {
      this.constructor.requestState(this.props.params)
      .then((response) => {
        this.setReduxState(response);
      });
      return;
    }

    //// DEPRECATED
    if (this.constructor.__redux) {
      return;
    }

    this.state = context.getInitialData();

    if (!this.state || this.state && Object.keys(this.state).length === 0 && JSON.stringify(this.state) === JSON.stringify({})) {
      this.state = this.constructor.emptyState();
    }

    if (!this.isRenderedFromServer()) {
      this.constructor.requestState(this.props.params, api)
      .then((response) => {
        this.setState(response);
      });
    }
    ////
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
