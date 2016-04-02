import {Component, PropTypes} from 'react';
import api from '../../utils/singleton_api';

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
    this.state = context.getInitialData();
    if (!this.isRenderedFromServer() && !this.state) {
      this.state = this.constructor.emptyState();
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
  router: PropTypes.object
};

RouteHandler.propTypes = {
  params: PropTypes.object
};

export default RouteHandler;
