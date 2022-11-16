import React from 'react';
import { IndexRoute, Route } from 'react-router-dom';
import App from 'app/App/App';
import Activitylog from 'app/Activitylog/Activitylog';
import { trackPage } from 'app/App/GoogleAnalytics';
import Configure2fa from 'app/Auth2fa/Configure2fa';
import EditTranslations from 'app/I18N/EditTranslations';
import blankState from 'app/Library/helpers/blankState';
import Library from 'app/Library/Library';
import LibraryMap from 'app/Library/LibraryMap';
import { MetadataExtractionDashboard } from 'app/MetadataExtraction/MetadataExtractionDashboard';
import { IXSuggestions } from 'app/MetadataExtraction/SuggestionsContainer';
import EditPage from 'app/Pages/EditPage';
import NewPage from 'app/Pages/NewPage';
import Pages from 'app/Pages/Pages';
import PageView from 'app/Pages/PageView';
import EditRelationType from 'app/RelationTypes/EditRelationType';
import NewRelationType from 'app/RelationTypes/NewRelationType';
import OneUpReview from 'app/Review/OneUpReview';
import SemanticSearchResultsView from 'app/SemanticSearch/SemanticSearchResultsView';
import {
  PreserveSettings,
  AccountSettings,
  CollectionSettings,
  Customisation,
  CustomUploads,
  EntityTypesList,
  FiltersForm,
  LanguageList,
  NavlinksSettings,
  RelationTypesList,
  Settings,
  ThesauriList,
  TranslationsList,
  Dashboard,
} from 'app/Settings';
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
import { UserManagement } from 'app/Users/UserManagement';
import { store } from './store';
import { LibraryTable } from './Library/LibraryTable';
import { validateHomePageRoute } from './utils/routeHelpers';

const onEnter = () => {
  trackPage();
};

const goToLogin = () => {
  window.location.assign('/login');
};
const enterLogin = ({ location }) => {
  if (location.action === 'REPLACE') {
    goToLogin();
  }
};

const needsAuth = (_nxtState, _replace) => {
  if (!store.getState().user.get('_id')) {
    goToLogin();
  }
};

const enterOnLibrary = (_nxtState, _replace) => {
  const state = store.getState();
  if (blankState() && !state.user.get('_id')) {
    goToLogin();
    return () => {};
  }

  trackPage();
  return () => {};
};

const getDefaultLibraryComponent = defaultLibraryView => {
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
};

const getPageIndexRoute = customHomePage => {
  onEnter();
  const pageId = customHomePage[customHomePage.indexOf('page') + 1];
  const component = props => <PageView {...props} params={{ sharedId: pageId }} />;
  component.requestState = requestParams =>
    PageView.requestState(requestParams.set({ sharedId: pageId }));

  return {
    component,
    customHomePageId: pageId,
  };
};

const libraryDefaults = (callBack, state, defaultView) => {
  if (state.user.get('_id')) {
    return callBack(null, {
      onEnter: (_nextState, replace) => {
        replace('/library/?q=(includeUnpublished:!t)');
      },
    });
  }

  return callBack(null, getDefaultLibraryComponent(defaultView));
};
const getIndexRoute = (_nextState, callBack) => {
  const state = store.getState();
  const homePageSetting = state.settings.collection.get('home_page') || '';
  const customHomePage = homePageSetting ? homePageSetting.split('/').filter(v => v) : [];
  const defaultView = state.settings.collection.get('defaultLibraryView');

  if (!validateHomePageRoute(homePageSetting) || customHomePage.length === 0) {
    return libraryDefaults(callBack, state, defaultView);
  }
  return customHomePage.includes('page')
    ? callBack(null, getPageIndexRoute(customHomePage))
    : callBack(null, {
        onEnter: (_nxtState, replace) => {
          replace(customHomePage.join('/'));
        },
      });
};

const routes = (
  // <Route getIndexRoute={getIndexRoute}>
  <Route>
    {/* <Route path="settings" component={Settings} onEnter={needsAuth}>
      <Route path="account" component={AccountSettings} />
      <Route path="dashboard" component={Dashboard} />
      <Route path="2fa" component={Configure2fa} />
      <Route path="collection" component={CollectionSettings} />
      <Route path="navlinks" component={NavlinksSettings} />
      <Route path="users" component={UserManagement} />
      <Route path="preserve" component={PreserveSettings} />
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
      <Route path="metadata_extraction/suggestions/:propertyName" component={IXSuggestions} />
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
      <Route path="languages" component={LanguageList} />
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
    <Route path="login" component={Login} onEnter={enterLogin} />
    <Route path="setpassword/:key" component={ResetPassword} />
    <Route path="unlockaccount/:username/:code" component={UnlockAccount} />
    <Route path="document/:sharedId*" component={ViewerRoute} onEnter={onEnter} />
    <Route path="entity/:sharedId(/:tabView)" component={ViewerRoute} onEnter={onEnter} />
    <Route path="page/:sharedId" component={PageView} onEnter={onEnter} />
    <Route path="page/:sharedId/:slug" component={PageView} onEnter={onEnter} />
    <Route
      path="semanticsearch/:searchId"
      component={SemanticSearchResultsView}
      onEnter={onEnter}
    />
    <Route path="error/:errorCode" component={GeneralError} /> */}
    <Route path="404" element={GeneralError} />
  </Route>
);

export { getIndexRoute };

export default (
  <Route path="/" element={App}>
    {routes}
    <Route path=":lang">
      {routes}
      <Route path="*" element={GeneralError} />
    </Route>
    <Route path="*" element={GeneralError} />
  </Route>
);
