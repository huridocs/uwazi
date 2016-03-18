import React from 'react';
import {Route, IndexRoute} from 'react-router';

import App from './controllers/App/App';
import Layout from './controllers/App/Layout';
import NoMatch from './controllers/App/NoMatch';

import Login from './controllers/Users/Login';
import MyAccount from './controllers/Users/MyAccount';

import TemplatesController from './controllers/Templates/TemplatesController';
import ViewerController from './controllers/Viewer/ViewerController';
import Uploads from './controllers/Uploads/Uploads';

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Layout} />
    <Route path='/' component={Layout}>
      <Route path='my_account' component={MyAccount} />
      <Route path='uploads' component={Uploads} />
      <Route path='template' component={TemplatesController} />
      <Route path='template/edit/:templateId' component={TemplatesController} />
      <Route path='login' component={Login} />
    </Route>
    <Route path='document/:documentId' component={ViewerController} />
    <Route path="*" component={NoMatch} />
  </Route>
);
