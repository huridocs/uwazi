import {Component, PropTypes, Children} from 'react';
import {isClient} from '../../utils';

class Provider extends Component {

  constructor(props) {
    super(props);
    this.data = isClient && window.__initialData__ ? window.__initialData__ : props.initialData;
    this.user = isClient && window.__user__ ? window.__user__ : props.user;
  }

  getChildContext() {
    return {
      getInitialData: this.getInitialData.bind(this),
      getUser: this.getUser.bind(this)
    };
  }

  getUser() {
    return this.user;
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

Provider.propTypes = {
  user: PropTypes.object,
  children: PropTypes.object,
  initialData: PropTypes.object
};

Provider.childContextTypes = {
  getInitialData: PropTypes.func,
  getUser: PropTypes.func
};

export default Provider;
