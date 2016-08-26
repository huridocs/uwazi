import React from 'react';
import {Route, IndexRoute} from 'react-router';

import App from 'app/App/App';
import NoMatch from 'app/App/NoMatch';

import Login from 'app/Users/Login';
import ResetPassword from 'app/Users/ResetPassword';

import {
  Settings,
  AccountSettings,
  CollectionSettings,
  DocumentTypesList,
  EntityTypesList,
  RelationTypesList,
  ThesaurisList
} from 'app/Settings';

import ViewDocument from 'app/Viewer/ViewDocument';
import EntityView from 'app/Entities/EntityView';
import Uploads from 'app/Uploads/UploadsRoute';

import EditTemplate from 'app/Templates/EditTemplate';
import EditEntity from 'app/Templates/EditEntity';
import NewTemplate from 'app/Templates/NewTemplate';
import NewEntity from 'app/Templates/NewEntity';

import EditThesauri from 'app/Thesauris/EditThesauri';
import NewThesauri from 'app/Thesauris/NewThesauri';

import EditRelationType from 'app/RelationTypes/EditRelationType';
import NewRelationType from 'app/RelationTypes/NewRelationType';

import Library from 'app/Library/Library';

export default (
  <Route path='/' component={App}>
    <IndexRoute component={Library} />
    <Route path='settings' component={Settings}>
      <Route path='account' component={AccountSettings} />
      <Route path='collection' component={CollectionSettings} />
      <Route path='documents' component={DocumentTypesList} />
      <Route path='documents/new' component={NewTemplate} />
      <Route path='documents/edit/:templateId' component={EditTemplate} />
      <Route path='entities' component={EntityTypesList} />
      <Route path='entities/new' component={NewEntity} />
      <Route path='entities/edit/:templateId' component={EditEntity} />
      <Route path='connections' component={RelationTypesList} />
      <Route path='connections/new' component={NewRelationType} />
      <Route path='connections/edit/:relationTypeId' component={EditRelationType} />
      <Route path='dictionaries' component={ThesaurisList} />
      <Route path='dictionaries/new' component={NewThesauri} />
      <Route path='dictionaries/edit/:thesauriId' component={EditThesauri} />
    </Route>
    <Route path='uploads' component={Uploads} />
    <Route path='login' component={Login} />
    <Route path='resetpassword/:key' component={ResetPassword} />
    <Route path='document/:documentId' component={ViewDocument} />
    <Route path='entity/:entityId' component={EntityView} />
    <Route path="*" component={NoMatch} />
  </Route>
);
