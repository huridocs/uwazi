import {Component, PropTypes, Children} from 'react';
import {isClient} from 'app/utils';

class CustomProvider extends Component {

  constructor(props) {
    super(props);
    this.data = isClient && window.__initialData__ ? window.__initialData__ : props.initialData;
    this.renderedFromServer = true;
    this.user = isClient && window.__user__ ? window.__user__ : props.user;
  }

  getChildContext() {
    return {
      getInitialData: this.getInitialData.bind(this),
      isRenderedFromServer: this.isRenderedFromServer.bind(this),
      getUser: this.getUser.bind(this)
    };
  }

  getUser() {
    return this.user;
  }

  isRenderedFromServer() {
    let renderedFromServer = this.renderedFromServer;
    this.renderedFromServer = false;
    return renderedFromServer;
  }

  getInitialData() {
    let data = this.data;
    delete this.data;
    return data;
  }

  render() {
    let {children} = this.props;
    return Children.only(children);
  }
}

CustomProvider.propTypes = {
  user: PropTypes.object,
  children: PropTypes.object,
  initialData: PropTypes.object
};

CustomProvider.childContextTypes = {
  getInitialData: PropTypes.func,
  isRenderedFromServer: PropTypes.func,
  getUser: PropTypes.func
};

export default CustomProvider;
