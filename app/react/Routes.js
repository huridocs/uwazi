import React from 'react';
import {Route, IndexRoute} from 'react-router';

import App from './controllers/App/App';
import NoMatch from './controllers/App/NoMatch';

import Login from './controllers/Users/Login';
import MyAccount from './controllers/Users/MyAccount';
import Library from './controllers/Library/Library';

import Viewer from './controllers/Viewer/Viewer';
import Uploads from './controllers/Uploads/Uploads';

import Templates from '~/Templates/Templates';
import EditTemplate from '~/Templates/EditTemplate';
import NewTemplate from '~/Templates/NewTemplate';

import EditThesauri from '~/Thesauris/EditThesauri';

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Library} />
    <Route path='my_account' component={MyAccount} />
    <Route path='uploads' component={Uploads} />
    <Route path='templates' component={Templates} />
    <Route path='templates/new' component={NewTemplate} />
    <Route path='templates/edit/:templateId' component={EditTemplate} />
    <Route path='thesauris/new' component={EditThesauri} />
    <Route path='login' component={Login} />
    <Route path='document/:documentId' component={Viewer} />
    <Route path="*" component={NoMatch} />
  </Route>
);
