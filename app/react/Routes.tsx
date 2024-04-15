/* eslint-disable max-lines */
import React from 'react';
import { createRoutesFromElements, Route } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { App } from 'app/App/App';
import { LibraryCards } from 'app/Library/Library';
import { LibraryMap } from 'app/Library/LibraryMap';
import { PreserveSettings, EntityTypesList, Settings } from 'app/Settings';
import { EditTemplate } from 'app/Templates/EditTemplate';
import NewTemplate from 'app/Templates/NewTemplate';
import { Login } from 'app/Users/Login';
import GeneralError from 'app/App/ErrorHandling/GeneralError';
import { Users, usersLoader, userAction } from 'V2/Routes/Settings/Users/Users';
import { Collection, collectionLoader } from 'V2/Routes/Settings/Collection/Collection';
import { LibraryTable } from 'app/Library/LibraryTable';
import ViewerRoute from 'app/Viewer/ViewerRoute';
import { ClientSettings } from 'app/apiResponseTypes';
import {
  TranslationsList,
  translationsListLoader,
} from 'V2/Routes/Settings/Translations/TranslationsList';
import {
  EditTranslations,
  editTranslationsLoader,
  editTranslationsAction,
} from 'V2/Routes/Settings/Translations/EditTranslations';
import { Dashboard, dashboardLoader } from 'V2/Routes/Settings/Dashboard/Dashboard';

import {
  ThesaurusForm,
  theasauriListLoader,
  ThesauriList,
  editTheasaurusLoader,
} from 'app/V2/Routes/Settings/Thesauri';

import { MenuConfig, menuConfigloader } from 'V2/Routes/Settings/MenuConfig/MenuConfig';
import {
  RelationshipTypes,
  relationshipTypesLoader,
} from 'V2/Routes/Settings/RelationshipTypes/RelationshipTypes';
import { LanguagesList, languagesListLoader } from 'V2/Routes/Settings/Languages/LanguagesList';
import { Account, accountLoader } from 'V2/Routes/Settings/Account/Account';
import { IXdashboardLoader, IXDashboard } from 'V2/Routes/Settings/IX/IXDashboard';
import { IXSuggestions, IXSuggestionsLoader } from 'V2/Routes/Settings/IX/IXSuggestions';
import { PageEditor, pageEditorLoader, PagesList, pagesListLoader } from 'V2/Routes/Settings/Pages';
import { customisationLoader, Customisation } from 'V2/Routes/Settings/Customization/Customization';
import { activityLogLoader, ActivityLog } from 'V2/Routes/Settings/ActivityLog/ActivityLog';
import { CustomUploads, customUploadsLoader } from 'V2/Routes/Settings/CustomUploads/CustomUploads';
import { Filters, filtersLoader } from 'V2/Routes/Settings/Filters';
import { loggedInUsersRoute, adminsOnlyRoute, privateRoute } from './ProtectedRoute';
import { getIndexElement } from './getIndexElement';
import { PageView } from './Pages/PageView';
import { RouteErrorBoundary } from './App/ErrorHandling/RouteErrorBoundary';
import ResetPassword from './Users/ResetPassword';
import ConnectedUnlockAccount from './Users/UnlockAccount';
import OneUpReview from './Review/OneUpReview';
import { NewRelMigrationDashboard } from './Settings/components/relV2MigrationDashboard';

const getRoutesLayout = (
  settings: ClientSettings | undefined,
  indexElement: React.ReactNode,
  headers?: IncomingHttpHeaders
) => (
  <Route errorElement={<RouteErrorBoundary />}>
    <Route index element={indexElement} />
    <Route path="login" element={<Login />} />
    <Route path="library" element={privateRoute(<LibraryCards />, settings)} />
    <Route path="library/map" element={privateRoute(<LibraryMap />, settings)} />
    <Route path="library/table" element={privateRoute(<LibraryTable />, settings)} />
    <Route path="document/:sharedId/*" element={privateRoute(<ViewerRoute />, settings)} />
    <Route path="entity/:sharedId/*" element={privateRoute(<ViewerRoute />, settings)} />
    <Route path="entity/:sharedId/:tabView" element={privateRoute(<ViewerRoute />, settings)} />
    <Route path="error/:errorCode" element={<GeneralError />} />
    <Route path="404" element={<GeneralError />} />
    <Route path="page/:sharedId" element={<PageView />} />
    <Route path="page/:sharedId/:slug" element={<PageView />} />
    <Route path="setpassword/:key" element={<ResetPassword />} />
    <Route path="unlockaccount/:username/:code" element={<ConnectedUnlockAccount />} />
    <Route path="review" element={adminsOnlyRoute(<OneUpReview />)} />
    <Route path="settings" element={loggedInUsersRoute(<Settings />)}>
      <Route path="account" element={<Account />} loader={accountLoader(headers)} />
      <Route
        path="dashboard"
        element={adminsOnlyRoute(<Dashboard />)}
        loader={dashboardLoader(headers)}
      />
      <Route
        path="navlinks"
        element={adminsOnlyRoute(<MenuConfig />)}
        loader={menuConfigloader(headers)}
      />
      <Route
        path="collection"
        element={adminsOnlyRoute(<Collection />)}
        loader={collectionLoader(headers)}
      />
      <Route
        path="users"
        element={adminsOnlyRoute(<Users />)}
        loader={usersLoader(headers)}
        action={userAction()}
      />
      <Route path="preserve" element={adminsOnlyRoute(<PreserveSettings />)} />
      <Route path="pages">
        <Route index element={adminsOnlyRoute(<PagesList />)} loader={pagesListLoader(headers)} />
        <Route
          path="page/:sharedId?"
          element={adminsOnlyRoute(<PageEditor />)}
          loader={pageEditorLoader(headers)}
        />
      </Route>
      <Route path="templates">
        <Route index element={adminsOnlyRoute(<EntityTypesList />)} />
        <Route path="new" element={adminsOnlyRoute(<NewTemplate />)} />
        <Route path="edit/:templateId" element={adminsOnlyRoute(<EditTemplate />)} />
      </Route>
      <Route
        path="metadata_extraction"
        element={adminsOnlyRoute(<IXDashboard />)}
        loader={IXdashboardLoader(headers)}
      />
      <Route
        path="metadata_extraction/suggestions/:extractorId"
        loader={IXSuggestionsLoader(headers)}
        element={adminsOnlyRoute(<IXSuggestions />)}
      />
      <Route path="relationship-types">
        <Route
          index
          element={adminsOnlyRoute(<RelationshipTypes />)}
          loader={relationshipTypesLoader(headers)}
        />
      </Route>

      <Route path="thesauri">
        <Route
          index
          element={adminsOnlyRoute(<ThesauriList />)}
          loader={theasauriListLoader(headers)}
        />
        <Route path="new" element={adminsOnlyRoute(<ThesaurusForm />)} />
        <Route
          path="edit/:_id"
          element={adminsOnlyRoute(<ThesaurusForm />)}
          loader={editTheasaurusLoader(headers)}
        />
      </Route>
      <Route
        path="languages"
        element={adminsOnlyRoute(<LanguagesList />)}
        loader={languagesListLoader(headers)}
      />
      <Route path="translations">
        <Route
          index
          element={adminsOnlyRoute(<TranslationsList />)}
          loader={translationsListLoader(headers)}
        />
        <Route
          path="edit/:context"
          element={adminsOnlyRoute(<EditTranslations />)}
          loader={editTranslationsLoader(headers)}
          action={editTranslationsAction()}
        />
      </Route>
      <Route
        path="filters"
        element={adminsOnlyRoute(<Filters />)}
        loader={filtersLoader(headers)}
      />
      <Route
        path="customisation"
        element={adminsOnlyRoute(<Customisation />)}
        loader={customisationLoader(headers)}
      />
      <Route
        path="activitylog"
        element={adminsOnlyRoute(<ActivityLog />)}
        loader={activityLogLoader(headers)}
      />
      <Route
        path="custom-uploads"
        element={adminsOnlyRoute(<CustomUploads />)}
        loader={customUploadsLoader(headers)}
      />
      <Route
        path="newrelmigration"
        element={
          settings?.features?.newRelationships ? <NewRelMigrationDashboard /> : <GeneralError />
        }
      />
    </Route>
  </Route>
);

const getRoutes = (
  settings: ClientSettings | undefined,
  userId: string | undefined,
  headers?: IncomingHttpHeaders
) => {
  const { element, parameters } = getIndexElement(settings, userId);
  const layout = getRoutesLayout(settings, element, headers);
  return createRoutesFromElements(
    <Route path="/" element={<App customParams={parameters} />}>
      {layout}
      <Route path=":lang">
        {layout}
        <Route path="*" element={<GeneralError />} />
      </Route>
      <Route path="*" element={<GeneralError />} />
    </Route>
  );
};

export { getRoutes };
