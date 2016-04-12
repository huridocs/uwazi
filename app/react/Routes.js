import React from 'react';
import {Route, IndexRoute} from 'react-router';

import App from './controllers/App/App';
import NoMatch from './controllers/App/NoMatch';

import Login from './controllers/Users/Login';
import MyAccount from './controllers/Users/MyAccount';

// import Viewer from './controllers/Viewer/Viewer';
import ViewDocument from 'app/Viewer/ViewDocument';
import Uploads from './controllers/Uploads/Uploads';

import Metadata from 'app/Metadata/Metadata';

import EditTemplate from 'app/Templates/EditTemplate';
import NewTemplate from 'app/Templates/NewTemplate';

import EditThesauri from 'app/Thesauris/EditThesauri';
import NewThesauri from 'app/Thesauris/NewThesauri';

import Library from 'app/Library/Library';

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Library} />
    <Route path='my_account' component={MyAccount} />
    <Route path='uploads' component={Uploads} />
    <Route path='metadata' component={Metadata} />
    <Route path='templates/new' component={NewTemplate} />
    <Route path='templates/edit/:templateId' component={EditTemplate} />
    <Route path='thesauris/new' component={NewThesauri} />
    <Route path='thesauris/edit/:thesauriId' component={EditThesauri} />
    <Route path='login' component={Login} />
    <Route path='document/:documentId' component={ViewDocument} />
    <Route path="*" component={NoMatch} />
  </Route>
);
