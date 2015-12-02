import React from 'react'
import { Route, IndexRoute } from 'react-router'

import App from './components/App/App'
import NoMatch from './components/App/NoMatch'
import Home from './components/App/Home'

import Login from './components/Users/Login'
import MyAccount from './components/Users/MyAccount'

import Users from './components/Users'
import FormExample from './components/Form/FormExample'

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Home} />
    <Route path='users' component={Users} />
    <Route path='login' component={Login} />
    <Route path='my_account' component={MyAccount} />
    <Route path='form' component={FormExample} />
    <Route path="*" component={NoMatch} />
  </Route>
);
