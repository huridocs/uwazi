import React from 'react';
import {Route, IndexRoute} from 'react-router';

import App from './controllers/App/App';
import NoMatch from './controllers/App/NoMatch';

import Login from './controllers/Users/Login';
import MyAccount from './controllers/Users/MyAccount';
import Library from './controllers/Library/Library';

import Templates from './controllers/Templates/Templates';
import Viewer from './controllers/Viewer/Viewer';
import Uploads from './controllers/Uploads/Uploads';

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Library} />
    <Route path='my_account' component={MyAccount} />
    <Route path='uploads' component={Uploads} />
    <Route path='templates' component={Templates} >
      <Route path='new' component={Templates} />
      <Route path='edit/:templateId' component={Templates} />
    </Route>
    <Route path='login' component={Login} />
    <Route path='document/:documentId' component={Viewer} />
    <Route path="*" component={NoMatch} />
  </Route>
);
