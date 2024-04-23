import React from 'react';
import {
  LoaderFunction,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { App } from 'app/App/App';
import GeneralError from 'app/App/ErrorHandling/GeneralError';

const Routes = ({ headers }: { headers?: IncomingHttpHeaders }) => (
  <Route>
    {/* <Route index element={indexElement} />
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
        element={adminsOnlyRoute(<FiltersTable />)}
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
    </Route> */}
  </Route>
);

const clientRouterLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<{}> =>
  async () => {
    console.log('MAIN CLIENT LOADER');
    return {};
  };

const clientRouter = (headers?: IncomingHttpHeaders) =>
  createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<App />} loader={clientRouterLoader(headers)}>
        <Route path=":lang">
          <Routes headers={headers} />
          <Route path="*" element={<GeneralError />} />
        </Route>
        <Route path="*" element={<GeneralError />} />
      </Route>
    )
  );

const serverRouter = (headers: IncomingHttpHeaders) =>
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route path=":lang">
        <Routes headers={headers} />
        <Route path="*" element={<GeneralError />} />
      </Route>
      <Route path="*" element={<GeneralError />} />
    </Route>
  );

export { clientRouter, serverRouter };
