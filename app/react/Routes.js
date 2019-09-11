import React from 'react';
import { Route, IndexRoute } from 'react-router';

import App from 'app/App/App';
import NoMatch from 'app/App/NoMatch';

import Login from 'app/Users/Login';
import ResetPassword from 'app/Users/ResetPassword';
import UnlockAccount from 'app/Users/UnlockAccount';

import {
  Settings,
  AccountSettings,
  CollectionSettings,
  NavlinksSettings,
  EntityTypesList,
  RelationTypesList,
  ThesaurisList,
  TranslationsList,
  FiltersForm,
  Languages,
  Customisation,
  CustomUploads
} from 'app/Settings';

import Activitylog from 'app/Activitylog/Activitylog';
import Pages from 'app/Pages/Pages';
import NewPage from 'app/Pages/NewPage';
import EditPage from 'app/Pages/EditPage';
import PageView from 'app/Pages/PageView';

import { Users, NewUser, EditUser } from 'app/Users';

import ViewDocument from 'app/Viewer/ViewDocument';
import EntityView from 'app/Entities/EntityView';
import Uploads from 'app/Uploads/UploadsRoute';

import EditTemplate from 'app/Templates/EditTemplate';
import NewTemplate from 'app/Templates/NewTemplate';

import EditThesauri from 'app/Thesauris/EditThesauri';
import NewThesauri from 'app/Thesauris/NewThesauri';

import EditRelationType from 'app/RelationTypes/EditRelationType';
import NewRelationType from 'app/RelationTypes/NewRelationType';

import EditTranslations from 'app/I18N/EditTranslations';

import Library from 'app/Library/Library';
import LibraryMap from 'app/Library/LibraryMap';

import SemanticSearchResultsView from 'app/SemanticSearch/SemanticSearchResultsView';

import { trackPage } from 'app/App/GoogleAnalytics';
import blankState from 'app/Library/helpers/blankState';
import { store } from './store';

function onEnter() {
  trackPage();
}

function needsAuth(nxtState, replace) {
  if (!store.getState().user.get('_id')) {
    replace('/login');
  }
}

function enterOnLibrary(nxtState, replace) {
  const state = store.getState();
  if (blankState() && !state.user.get('_id')) {
    return replace('/login');
  }
  trackPage();
}

function getIndexRoute(nextState, callBack) {
  const state = store.getState();
  const homePageSetting = state.settings.collection.get('home_page');
  const customHomePage = homePageSetting ? homePageSetting.split('/') : [];
  const isPageRoute = customHomePage.includes('page');

  let pageId = '';
  let component = Library;
  if (isPageRoute) {
    pageId = customHomePage[customHomePage.indexOf('page') + 1];
    component = props => <PageView {...props} params={{ sharedId: pageId }}/>;
    component.requestState = requestParams => PageView.requestState(requestParams.set({ sharedId: pageId }));
  }

  const indexRoute = {
    component,
    onEnter: (nxtState, replace) => {
      if (!isPageRoute) {
        replace(customHomePage.join('/'));
      }
      if (!homePageSetting) {
        enterOnLibrary(nxtState, replace);
      }
    },
    customHomePageId: pageId
  };
  callBack(null, indexRoute);
}

const routes = (
  <Route getIndexRoute={getIndexRoute}>
    <Route path="settings" component={Settings} onEnter={needsAuth}>
      <Route path="account" component={AccountSettings} />
      <Route path="collection" component={CollectionSettings} />
      <Route path="navlinks" component={NavlinksSettings} />
      <Route path="users">
        <IndexRoute component={Users} />
        <Route path="new" component={NewUser} />
        <Route path="edit/:userId" component={EditUser} />
      </Route>
      <Route path="pages">
        <IndexRoute component={Pages} />
        <Route path="new" component={NewPage} />
        <Route path="edit/:sharedId" component={EditPage} />
      </Route>
      <Route path="templates">
        <IndexRoute component={EntityTypesList} />
        <Route path="new" component={NewTemplate} />
        <Route path="edit/:templateId" component={EditTemplate} />
      </Route>
      <Route path="connections">
        <IndexRoute component={RelationTypesList} />
        <Route path="new" component={NewRelationType} />
        <Route path="edit/:_id" component={EditRelationType} />
      </Route>
      <Route path="dictionaries">
        <IndexRoute component={ThesaurisList} />
        <Route path="new" component={NewThesauri} />
        <Route path="edit/:_id" component={EditThesauri} />
      </Route>
      <Route path="languages" component={Languages}/>
      <Route path="translations">
        <IndexRoute component={TranslationsList} />
        <Route path="edit/:context" component={EditTranslations} />
      </Route>
      <Route path="filters" component={FiltersForm} />
      <Route path="customisation" component={Customisation} />
      <Route path="custom-uploads" component={CustomUploads} />
      <Route path="activitylog" component={Activitylog} onEnter={needsAuth} />
    </Route>
    <Route path="library" component={Library} onEnter={enterOnLibrary}/>
    <Route path="library/map" component={LibraryMap} onEnter={onEnter}/>
    <Route path="uploads" component={Uploads} />
    <Route path="login" component={Login} />
    <Route path="setpassword/:key" component={ResetPassword} />
    <Route path="unlockaccount/:username/:code" component={UnlockAccount} />
    <Route path="document/:sharedId*" component={ViewDocument} onEnter={onEnter}/>
    <Route path="entity/:sharedId" component={EntityView} onEnter={onEnter}/>
    <Route path="page/:sharedId" component={PageView} onEnter={onEnter}/>
    <Route path="semanticsearch/:searchId" component={SemanticSearchResultsView} onEnter={onEnter}/>
    <Route path="404" component={NoMatch} />
  </Route>
);

export default (
  <Route path="/" component={App}>
    {routes}
    <Route path=":lang">
      {routes}
      <Route path="*" component={NoMatch} />
    </Route>
    <Route path="*" component={NoMatch} />
  </Route>
);
