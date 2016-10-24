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
  NavlinksSettings,
  DocumentTypesList,
  EntityTypesList,
  RelationTypesList,
  ThesaurisList,
  TranslationsList
} from 'app/Settings';

import Pages from 'app/Pages/Pages';
import NewPage from 'app/Pages/NewPage';
import EditPage from 'app/Pages/EditPage';
import PageView from 'app/Pages/PageView';

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

import EditTranslations from 'app/I18N/EditTranslations';

import Library from 'app/Library/Library';
import RouteHandler from 'app/App/RouteHandler';

import store from './store';

function getIndexRoute(nextState, callBack) {
  let collectionSettings = store().getState().settings.collection.toJS();
  let indexRoute = {
    component: Library,
    onEnter: (nxtState, replace) => {
      if (collectionSettings.home_page) {
        replace(collectionSettings.home_page);
      }
    }
  };
  callBack(null, indexRoute);
}

const routes = (
  <Route getIndexRoute={getIndexRoute}>
    <Route path='settings' component={Settings}>
      <Route path='account' component={AccountSettings} />
      <Route path='collection' component={CollectionSettings} />
      <Route path='navlinks' component={NavlinksSettings} />
      <Route path='pages' component={Pages} />
      <Route path='pages/new' component={NewPage} />
      <Route path='pages/edit/:pageId' component={EditPage} />
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
      <Route path='translations' component={TranslationsList} />
      <Route path='translations/edit/:context' component={EditTranslations} />
    </Route>
    <Route path='library' component={Library} />
    <Route path='uploads' component={Uploads} />
    <Route path='login' component={Login} />
    <Route path='resetpassword/:key' component={ResetPassword} />
    <Route path='document/:documentId' component={ViewDocument} />
    <Route path='entity/:entityId' component={EntityView} />
    <Route path='page/:pageId' component={PageView} />
  </Route>
);

export default (
  <Route path='/' component={App}>
    {routes}
    <Route path=':lang'>
      {routes}
      <Route path="*" component={NoMatch} />
    </Route>
    <Route path="*" component={NoMatch} />
  </Route>
);
