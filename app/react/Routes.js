import React from 'react'
import { Route, IndexRoute } from 'react-router'
import App from './components/App'
import Home from './components/Home'
import Users from './components/Users'
import Login from './components/Login'
import NoMatch from './components/NoMatch'
import MyAccount from './components/Users/MyAccount'

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Home} />
    <Route path='users' component={Users} />
    <Route path='login' component={Login} />
    <Route path='my_account' component={MyAccount} />
    <Route path="*" component={NoMatch} />
  </Route>
);
