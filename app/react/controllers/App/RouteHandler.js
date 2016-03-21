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
    this.state = context.getInitialData();

    if (!this.state) {
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
  getUser: PropTypes.func,
  router: PropTypes.object
};

RouteHandler.propTypes = {
  params: PropTypes.object
};

export default RouteHandler;
