import {Component, PropTypes} from 'react';
import template from './templates/login.js';
import {browserHistory} from 'react-router';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import auth from 'app/Auth';

export class Login extends Component {

  constructor(props, context) {
    super(props, context);
    this.state = {error: false};
    this.state.credentials = {username: '', password: ''};
  }

  userChange(e) {
    this.state.credentials.username = e.target.value;
    this.setState(this.state);
  }

  passwordChange(e) {
    this.state.credentials.password = e.target.value;
    this.setState(this.state);
  }

  submit(e) {
    e.preventDefault();

    return this.props.login(this.state.credentials)
    .then(() => {
      this.setState({error: false});
      browserHistory.push('/');
    })
    .catch(() => {
      this.setState({error: true});
    });
  }

  render() {
    this.render = template.bind(this);
    return this.render();
  }
}

Login.propTypes = {
  login: PropTypes.func
};

export default Login;

function mapDispatchToProps(dispatch) {
  return bindActionCreators({login: auth.actions.login}, dispatch);
}

export default connect(null, mapDispatchToProps)(Login);
