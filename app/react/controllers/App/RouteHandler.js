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

  constructor(props, context) {
    super(props);

    //// TEST !
    if (!context.isRenderedFromServer() && this.setReduxState) {
      this.constructor.requestState(this.props.params)
      .then((response) => {
        this.setReduxState(response);
      });
      return;
    }
    ////

    this.state = context.getInitialData();

    if (!context.isRenderedFromServer() && !this.state) {
      this.state = this.constructor.emptyState();
      this.constructor.requestState(this.props.params, api)
      .then((response) => {
        this.setState(response);
      });
    }
  }
}

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
