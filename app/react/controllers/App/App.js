import fetch from 'isomorphic-fetch';
import React, {Component, PropTypes} from 'react';
import {events} from '../../utils/index';
import Helmet from 'react-helmet';
import 'bootstrap/dist/css/bootstrap.css';
import './scss/App.scss';
import 'font-awesome/css/font-awesome.css';
import Alerts from './Alerts.js';

class App extends Component {

  constructor(props, context) {
    super(props, context);
    // change fetch to use api and test it properly
    this.fetch = props.fetch || fetch;
    this.state = {user: context.getUser(), showmenu: false};
    events.on('login', () => {
      this.fetchUser();
    });
  }

  fetchUser() {
    return this.fetch('/api/user', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    })
    .then((response) => response.json())
    .then((response) => {
      this.setState({user: response});
    });
  }

  renderChildren() {
    return React.Children.map(this.props.children, (child) => {
      return React.cloneElement(child, {user: this.state.user});
    });
  }


  render() {
    return (
      <div>
        <Helmet
          titleTemplate='Uwazi - %s'
          meta={[
            {'char-set': 'utf-8'},
            {name: 'description', content: 'Uwazi docs'}
          ]}
        />
        <Alerts/>
        {this.renderChildren()}
      </div>
    );
  }
}

App.propTypes = {
  fetch: PropTypes.func,
  children: PropTypes.object
};

App.contextTypes = {
  getUser: PropTypes.func
};

export default App;
