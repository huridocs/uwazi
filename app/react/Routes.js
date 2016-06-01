import React from 'react';
import {Route, IndexRoute} from 'react-router';

import App from 'app/App/App';
import NoMatch from 'app/App/NoMatch';

import Login from 'app/Users/Login';
import MyAccount from 'app/Users/MyAccount';

import ViewDocument from 'app/Viewer/ViewDocument';
import Uploads from 'app/Uploads/UploadsRoute';

import Metadata from 'app/Metadata/Metadata';

import EditTemplate from 'app/Templates/EditTemplate';
import NewTemplate from 'app/Templates/NewTemplate';

import EditThesauri from 'app/Thesauris/EditThesauri';
import NewThesauri from 'app/Thesauris/NewThesauri';

import EditRelationType from 'app/RelationTypes/EditRelationType';
import NewRelationType from 'app/RelationTypes/NewRelationType';

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
    <Route path='relationtypes/new' component={NewRelationType} />
    <Route path='relationtypes/edit/:relationTypeId' component={EditRelationType} />
    <Route path='login' component={Login} />
    <Route path='document/:documentId' component={ViewDocument} />
    <Route path="*" component={NoMatch} />
  </Route>
);
