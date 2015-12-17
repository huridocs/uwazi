import React from 'react'
import { Route, IndexRoute } from 'react-router'

import App from './components/App/App'
import NoMatch from './components/App/NoMatch'
import Home from './components/App/Home'

import Login from './components/Users/Login'
import MyAccount from './components/Users/MyAccount'

import Users from './components/Users'
import TemplatesController from './components/Form/TemplatesController'
import Upload from './components/Upload/Upload'

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Home} />
    <Route path='users' component={Users} />
    <Route path='login' component={Login} />
    <Route path='my_account' component={MyAccount} />
    <Route path='upload' component={Upload} />
    <Route path='template' component={TemplatesController} />
    <Route path='template/edit/:templateId' component={TemplatesController} />
    <Route path="*" component={NoMatch} />
  </Route>
);
