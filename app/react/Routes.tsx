/* eslint-disable max-lines */
import React, { ReactElement } from 'react';
import { createRoutesFromElements, Route } from 'react-router-dom';
import { App } from 'app/App/App';
import Activitylog from 'app/Activitylog/Activitylog';
import Configure2fa from 'app/Auth2fa/Configure2fa';
import EditTranslations from 'app/I18N/EditTranslations';
import { LibraryCards } from 'app/Library/Library';
import { LibraryMap } from 'app/Library/LibraryMap';
import { MetadataExtractionDashboard } from 'app/MetadataExtraction/MetadataExtractionDashboard';
import EditPage from 'app/Pages/EditPage';
import NewPage from 'app/Pages/NewPage';
import Pages from 'app/Pages/Pages';
import EditRelationType from 'app/RelationTypes/EditRelationType';
import NewRelationType from 'app/RelationTypes/NewRelationType';
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
import { Login } from 'app/Users/Login';
import GeneralError from 'app/App/ErrorHandling/GeneralError';
import { UserManagement } from 'app/Users/UserManagement';
import { LibraryTable } from 'app/Library/LibraryTable';
import { ProtectedRoute } from './ProtectedRoute';

// const onEnter = () => {
//   trackPage();
// };

// const goToLogin = () => {
//   window.location.assign('/login');
// };

// const enterLogin = ({ location }) => {
//   if (location.action === 'REPLACE') {
//     goToLogin();
//   }
// };

// const needsAuth = (_nxtState, _replace) => {
//   if (!store.getState().user.get('_id')) {
//     goToLogin();
//   }
// };

// const enterOnLibrary = (_nxtState, _replace) => {
//   const state = store.getState();
//   if (blankState() && !state.user.get('_id')) {
//     goToLogin();
//     return () => {};
//   }

//   trackPage();
//   return () => {};
// };

// const getDefaultLibraryComponent = defaultLibraryView => {
//   switch (defaultLibraryView) {
//     case 'table':
//       return {
//         component: LibraryTable,
//         onEnter: enterOnLibrary,
//       };
//     case 'map':
//       return {
//         component: LibraryMap,
//         onEnter,
//       };
//     case 'cards':
//     default:
//       return {
//         component: Library,
//         onEnter: enterOnLibrary,
//       };
//   }
// };

// const getPageIndexRoute = customHomePage => {
//   onEnter();
//   const pageId = customHomePage[customHomePage.indexOf('page') + 1];
//   const component = props => <PageView {...props} params={{ sharedId: pageId }} />;
//   component.requestState = async requestParams =>
//     PageView.requestState(requestParams.set({ sharedId: pageId }));

//   return {
//     component,
//     customHomePageId: pageId,
//   };
// };

// const libraryDefaults = (callBack, state, defaultView) => {
//   if (state.user.get('_id')) {
//     return callBack(null, {
//       onEnter: (_nextState, replace) => {
//         replace('/library/?q=(includeUnpublished:!t)');
//       },
//     });
//   }

//   return callBack(null, getDefaultLibraryComponent(defaultView));
// };

// const getIndexRoute = (_nextState, callBack) => {
//   const state = store.getState();
//   const homePageSetting = state.settings.collection.get('home_page') || '';
//   const customHomePage = homePageSetting ? homePageSetting.split('/').filter(v => v) : [];
//   const defaultView = state.settings.collection.get('defaultLibraryView');

//   if (!validateHomePageRoute(homePageSetting) || customHomePage.length === 0) {
//     return libraryDefaults(callBack, state, defaultView);
//   }
//   return customHomePage.includes('page')
//     ? callBack(null, getPageIndexRoute(customHomePage))
//     : callBack(null, {
//         onEnter: (_nxtState, replace) => {
//           replace(customHomePage.join('/'));
//         },
//       });
// };

const adminRoute = (element: ReactElement) => <ProtectedRoute onlyAdmin>{element}</ProtectedRoute>;

const routesLayout = (
  <Route>
    <Route path="login" element={<Login />} />
    <Route
      path="settings"
      element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      }
    >
      <Route path="account" element={<AccountSettings />} />
      <Route path="dashboard" element={adminRoute(<Dashboard />)} />
      <Route path="2fa" element={adminRoute(<Configure2fa />)} />
      <Route path="collection" element={adminRoute(<CollectionSettings />)} />
      <Route path="navlinks" element={adminRoute(<NavlinksSettings />)} />
      <Route path="users" element={adminRoute(<UserManagement />)} />
      <Route path="preserve" element={adminRoute(<PreserveSettings />)} />
      <Route path="pages">
        <Route index element={adminRoute(<Pages />)} />
        <Route path="new" element={adminRoute(<NewPage />)} />
        <Route path="edit/:sharedId" element={adminRoute(<EditPage />)} />
      </Route>
      <Route path="templates">
        <Route index element={adminRoute(<EntityTypesList />)} />
        <Route path="new" element={adminRoute(<NewTemplate />)} />
        <Route path="edit/:templateId" element={adminRoute(<EditTemplate />)} />
      </Route>
      <Route path="metadata_extraction" element={adminRoute(<MetadataExtractionDashboard />)} />
      {/* <Route path="metadata_extraction/suggestions/:propertyName" element={<IXSuggestions />} /> */}
      <Route path="connections">
        <Route index element={adminRoute(<RelationTypesList />)} />
        <Route path="new" element={adminRoute(<NewRelationType />)} />
        <Route path="edit/:_id" element={adminRoute(<EditRelationType />)} />
      </Route>
      <Route path="dictionaries">
        <Route index element={adminRoute(<ThesauriList />)} />
        <Route path="new" element={adminRoute(<NewThesauri />)} />
        <Route path="edit/:_id" element={adminRoute(<EditThesauri />)} />
        <Route path="cockpit/:_id" element={adminRoute(<ThesaurusCockpit />)} />
      </Route>
      <Route path="languages" element={adminRoute(<LanguageList />)} />
      <Route path="translations">
        <Route index element={adminRoute(<TranslationsList />)} />
        <Route path="edit/:context" element={adminRoute(<EditTranslations />)} />
      </Route>
      <Route path="filters" element={adminRoute(<FiltersForm />)} />
      <Route path="customisation" element={adminRoute(<Customisation />)} />
      <Route path="custom-uploads" element={adminRoute(<CustomUploads />)} />
      <Route path="activitylog" element={adminRoute(<Activitylog />)} />
    </Route>
    <Route path="library" element={<LibraryCards />} />
    <Route path="library/map" element={<LibraryMap />} />
    <Route path="library/table" element={<LibraryTable />} />
    <Route path="error/:errorCode" element={<GeneralError />} />
    <Route path="404" element={<GeneralError />} />
  </Route>
);

const routes = createRoutesFromElements(
  <Route path="/" element={<App />}>
    {routesLayout}
    <Route path=":lang">
      {routesLayout}
      <Route path="*" element={<GeneralError />} />
    </Route>
    <Route path="*" element={<GeneralError />} />
  </Route>
);

export { routes };
