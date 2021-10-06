/** @format */
import Activitylog from 'app/Activitylog/Activitylog';
import App from 'app/App/App';
import { trackPage } from 'app/App/GoogleAnalytics';
import Configure2fa from 'app/Auth2fa/Configure2fa';
import EditTranslations from 'app/I18N/EditTranslations';
import blankState from 'app/Library/helpers/blankState';
import Library from 'app/Library/Library';
import LibraryMap from 'app/Library/LibraryMap';
import EditPage from 'app/Pages/EditPage';
import NewPage from 'app/Pages/NewPage';
import Pages from 'app/Pages/Pages';
import PageView from 'app/Pages/PageView';
import EditRelationType from 'app/RelationTypes/EditRelationType';
import NewRelationType from 'app/RelationTypes/NewRelationType';
import OneUpReview from 'app/Review/OneUpReview';
import SemanticSearchResultsView from 'app/SemanticSearch/SemanticSearchResultsView';
import {
  AccountSettings,
  CollectionSettings,
  Customisation,
  CustomUploads,
  EntityTypesList,
  FiltersForm,
  Languages,
  NavlinksSettings,
  RelationTypesList,
  Settings,
  ThesauriList,
  TranslationsList,
} from 'app/Settings';
import MetadataExtractionDashboard from 'app/MetadataExtraction/MetadataExtractionDashboard';
import EditTemplate from 'app/Templates/EditTemplate';
import NewTemplate from 'app/Templates/NewTemplate';
import EditThesauri from 'app/Thesauri/EditThesauri';
import NewThesauri from 'app/Thesauri/NewThesauri';
import ThesaurusCockpit from 'app/Thesauri/ThesaurusCockpit';
import Uploads from 'app/Uploads/UploadsRoute';
import Login from 'app/Users/Login';
import ResetPassword from 'app/Users/ResetPassword';
import UnlockAccount from 'app/Users/UnlockAccount';
import ViewerRoute from 'app/Viewer/ViewerRoute';
import GeneralError from 'app/App/ErrorHandling/GeneralError';
import React from 'react';

import { IndexRoute, Route } from 'react-router';
import { UserManagement } from 'app/Users/UserManagement';
import { EntitySuggestions } from 'app/MetadataExtraction/EntitySuggestions';
import { store } from './store';
import { LibraryTable } from './Library/LibraryTable';

function onEnter() {
  trackPage();
}

function needsAuth(_nxtState, replace) {
  if (!store.getState().user.get('_id')) {
    replace('/login');
  }
}

function enterOnLibrary(_nxtState, replace) {
  const state = store.getState();
  if (blankState() && !state.user.get('_id')) {
    return replace('/login');
  }
  trackPage();
}

function getDefaultLibraryComponent(defaultLibraryView) {
  switch (defaultLibraryView) {
    case 'table':
      return {
        component: LibraryTable,
        onEnter: enterOnLibrary,
      };
    case 'map':
      return {
        component: LibraryMap,
        onEnter,
      };
    case 'cards':
    default:
      return {
        component: Library,
        onEnter: enterOnLibrary,
      };
  }
}

function getPageIndexRoute(customHomePage) {
  const pageId = customHomePage[customHomePage.indexOf('page') + 1];
  const component = props => <PageView {...props} params={{ sharedId: pageId }} />;
  component.requestState = requestParams =>
    PageView.requestState(requestParams.set({ sharedId: pageId }));

  return {
    component,
    customHomePageId: pageId,
  };
}

function getIndexRoute(_nextState, callBack) {
  const state = store.getState();
  const homePageSetting = state.settings.collection.get('home_page');
  const customHomePage = homePageSetting ? homePageSetting.split('/').filter(v => v) : [];
  const isPageRoute = customHomePage.includes('page');

  if (isPageRoute) {
    return callBack(null, getPageIndexRoute(customHomePage));
  }

  if (customHomePage.length) {
    return callBack(null, {
      onEnter: (_nxtState, replace) => {
        replace(customHomePage.join('/'));
      },
    });
  }

  return callBack(
    null,
    getDefaultLibraryComponent(state.settings.collection.get('defaultLibraryView'))
  );
}

const routes = (
  <Route getIndexRoute={getIndexRoute}>
    <Route path="settings" component={Settings} onEnter={needsAuth}>
      <Route path="account" component={AccountSettings} />
      <Route path="2fa" component={Configure2fa} />
      <Route path="collection" component={CollectionSettings} />
      <Route path="navlinks" component={NavlinksSettings} />
      <Route path="users" component={UserManagement} />
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
      <Route path="metadata_extraction" component={MetadataExtractionDashboard} />
      <Route path="metadata_extraction/suggestions" component={EntitySuggestions} />
      <Route path="connections">
        <IndexRoute component={RelationTypesList} />
        <Route path="new" component={NewRelationType} />
        <Route path="edit/:_id" component={EditRelationType} />
      </Route>
      <Route path="dictionaries">
        <IndexRoute component={ThesauriList} />
        <Route path="new" component={NewThesauri} />
        <Route path="edit/:_id" component={EditThesauri} />
        <Route path="cockpit/:_id" component={ThesaurusCockpit} />
      </Route>
      <Route path="languages" component={Languages} />
      <Route path="translations">
        <IndexRoute component={TranslationsList} />
        <Route path="edit/:context" component={EditTranslations} />
      </Route>
      <Route path="filters" component={FiltersForm} />
      <Route path="customisation" component={Customisation} />
      <Route path="custom-uploads" component={CustomUploads} />
      <Route path="activitylog" component={Activitylog} onEnter={needsAuth} />
    </Route>
    <Route path="library" component={Library} onEnter={enterOnLibrary} />
    <Route path="library/map" component={LibraryMap} onEnter={onEnter} />
    <Route path="library/table" component={LibraryTable} onEnter={enterOnLibrary} />
    <Route path="review" component={OneUpReview} onEnter={needsAuth} />
    <Route path="uploads" component={Uploads} />
    <Route path="login" component={Login} />
    <Route path="setpassword/:key" component={ResetPassword} />
    <Route path="unlockaccount/:username/:code" component={UnlockAccount} />
    <Route path="document/:sharedId*" component={ViewerRoute} onEnter={onEnter} />
    <Route path="entity/:sharedId" component={ViewerRoute} onEnter={onEnter} />
    <Route path="page/:sharedId" component={PageView} onEnter={onEnter} />
    <Route path="page/:sharedId/:slug" component={PageView} onEnter={onEnter} />
    <Route
      path="semanticsearch/:searchId"
      component={SemanticSearchResultsView}
      onEnter={onEnter}
    />
    <Route path="error/:errorCode" component={GeneralError} />
    <Route path="404" component={GeneralError} />
  </Route>
);

export default (
  <Route path="/" component={App}>
    {routes}
    <Route path=":lang">
      {routes}
      <Route path="*" component={GeneralError} />
    </Route>
    <Route path="*" component={GeneralError} />
  </Route>
);
