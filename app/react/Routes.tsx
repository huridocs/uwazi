/* eslint-disable max-lines */
import React from 'react';
import { createRoutesFromElements, Navigate, Route } from 'react-router';
import { IncomingHttpHeaders } from 'http';
import { App } from '#app/App/App.js';
import { LibraryRoot } from './Library/Library.js';
import { LibraryMap } from './Library/LibraryMap.js';
import { LibraryCards } from './Library/LibraryCards.js';
import { LibraryTable } from './Library/LibraryTable.js';
import { Preserve } from '#V2/Routes/Settings/Preserve/Preserve.js';
import { Settings } from '#V2/Routes/Settings/Settings.js';
import { Login } from './Users/Login.js';
import { Users, usersLoader, userAction } from '#V2/Routes/Settings/Users/Users.js';
import { Collection, collectionLoader } from '#V2/Routes/Settings/Collection/Collection.js';
import { ViewerRoute } from './Viewer/ViewerRoute.js';
import { ClientSettings } from '#app/apiResponseTypes.js';
import {
  TranslationsList,
  translationsListLoader,
} from '#V2/Routes/Settings/Translations/TranslationsList.js';
import {
  EditTranslations,
  editTranslationsLoader,
  editTranslationsAction,
} from '#V2/Routes/Settings/Translations/EditTranslations.js';
import { Dashboard, dashboardLoader } from '#V2/Routes/Settings/Dashboard/Dashboard.js';
import {
  EditThesaurus,
  thesauriLoader,
  ThesauriList,
  editThesaurusLoader,
} from '#app/V2/Routes/Settings/Thesauri/index.js';
import { MenuConfig, menuConfigloader } from '#V2/Routes/Settings/MenuConfig/MenuConfig.js';
import {
  RelationshipTypes,
  relationshipTypesLoader,
} from '#V2/Routes/Settings/RelationshipTypes/RelationshipTypes.js';
import { LanguagesList, languagesListLoader } from '#V2/Routes/Settings/Languages/LanguagesList.js';
import { Account, accountLoader } from '#V2/Routes/Settings/Account/Account.js';
import { IXdashboardLoader, IXDashboard } from '#V2/Routes/Settings/IX/IXDashboard.js';
import { IXSuggestions, IXSuggestionsLoader } from '#V2/Routes/Settings/IX/IXSuggestions.js';
import {
  PageEditor,
  pageEditorLoader,
  PagesList,
  pagesListLoader,
} from '#V2/Routes/Settings/Pages/index.js';
import {
  customisationLoader,
  Customisation,
} from '#V2/Routes/Settings/Customization/Customization.js';
import { ActivityLog, activityLogLoader } from '#V2/Routes/Settings/ActivityLog/index.js';
import {
  CustomUploads,
  customUploadsLoader,
} from '#V2/Routes/Settings/CustomUploads/CustomUploads.js';
import { FiltersTable, filtersLoader } from '#V2/Routes/Settings/Filters/index.js';
import { RouteErrorBoundary, GeneralError } from '#V2/Components/ErrorHandling/index.js';
import {
  ParagraphExtractorLoader,
  PXEntityLoader,
  PXParagraphLoader,
} from '#V2/Routes/Settings/ParagraphExtraction/Loaders.js';
import { ParagraphExtractorDashboard } from '#V2/Routes/Settings/ParagraphExtraction/ParagraphExtraction.js';
import { PXEntityDashboard } from '#V2/Routes/Settings/ParagraphExtraction/PXEntities.js';
import { PXParagraphDashboard } from '#V2/Routes/Settings/ParagraphExtraction/PXParagraphs.js';
import {
  Templates,
  templatesLoader,
  TemplatesEditor,
  templatesEditorLoader,
} from '#V2/Routes/Settings/Templates/index.js';
import { Entity, entityLoader } from '#V2/Routes/Entity/index.js';
import {
  loggedInUsersRoute,
  adminsOnlyRoute,
  privateRoute,
  ProtectedRoute,
} from './ProtectedRoute.js';
import type { IndexDescriptor } from './getIndexElement.js';
import { getIndexDescriptor } from './getIndexElement.js';
import { PageView } from './Pages/PageView.js';
import { ResetPassword } from './Users/ResetPassword.js';
import { UnlockAccount } from './Users/UnlockAccount.js';
import { NewRelMigrationDashboard } from './Settings/components/relV2MigrationDashboard.js';
import { CSVList, csvListLoader } from './V2/Routes/Settings/CSVUpload/index.js';

const deconstructSearchQuery = (query?: string) => {
  if (!query) return '';
  if (query.startsWith('?q=')) return decodeURI(query.substring(1).split('=')[1]);
  return `(${query.substring(1)})`;
};

type IndexComponents = {
  LibraryRoot: React.ComponentType<{ children?: React.ReactNode }>;
  LibraryCards: React.ComponentType<{ params?: { q?: string } }>;
  LibraryTable: React.ComponentType<{ params?: { q?: string } }>;
  LibraryMap: React.ComponentType<{ params?: { q?: string } }>;
  Login: React.ComponentType<Record<string, never>>;
};

const buildIndexElement = (
  descriptor: IndexDescriptor,
  indexComponents?: IndexComponents
): React.ReactNode => {
  const Root = indexComponents?.LibraryRoot ?? LibraryRoot;
  const Cards = indexComponents?.LibraryCards ?? LibraryCards;
  const Table = indexComponents?.LibraryTable ?? LibraryTable;
  const Map = indexComponents?.LibraryMap ?? LibraryMap;
  const LoginComp = indexComponents?.Login ?? Login;

  switch (descriptor.branch) {
    case 'libraryDefault': {
      const { userId, defaultLibraryView, private: privateInstance } = descriptor.libraryDefault;
      if (privateInstance && !userId) return <LoginComp />;
      const params = { q: '(includeUnpublished:!t)' };
      switch (defaultLibraryView) {
        case 'table':
          return (
            <Root>
              <Table params={params} />
            </Root>
          );
        case 'map':
          return (
            <Root>
              <Map params={params} />
            </Root>
          );
        default:
          return (
            <Root>
              <Cards params={params} />
            </Root>
          );
      }
    }
    case 'libraryCustom': {
      const { customHomePage } = descriptor.libraryCustom;
      const [query] = customHomePage.filter((path: string) => path.startsWith('?'));
      const queryString = query ? deconstructSearchQuery(query) : '';
      if (customHomePage.includes('map')) {
        return (
          <Root>
            <Map params={{ q: queryString }} />
          </Root>
        );
      }
      if (customHomePage.includes('table')) {
        return (
          <Root>
            <Table params={{ q: queryString }} />
          </Root>
        );
      }
      return (
        <Root>
          <Cards params={{ q: queryString }} />
        </Root>
      );
    }
    case 'page':
      return <PageView params={{ sharedId: descriptor.pageId }} />;
    case 'entity':
      return <ViewerRoute params={{ sharedId: descriptor.entityId }} />;
    case 'navigate':
      return <Navigate to={descriptor.navigateTo} />;
    default:
      return null;
  }
};

const getRoutesLayout = (
  settings: ClientSettings | undefined,
  indexElement: React.ReactNode,
  headers?: IncomingHttpHeaders,
  defaultToLibrary?: boolean
) => (
  <Route errorElement={<RouteErrorBoundary />}>
    <Route
      index
      element={indexElement}
      {...(defaultToLibrary ? { handle: { library: true } } : {})}
    />
    <Route path="login" element={<Login />} />
    <Route path="library/*" element={privateRoute(<LibraryRoot />, settings)}>
      <Route index element={privateRoute(<LibraryCards />, settings)} handle={{ library: true }} />
      <Route
        path="map"
        element={privateRoute(<LibraryMap />, settings)}
        handle={{ library: true }}
      />
      <Route
        path="table"
        element={privateRoute(<LibraryTable />, settings)}
        handle={{ library: true }}
      />
    </Route>
    <Route path="document/:sharedId" element={privateRoute(<ViewerRoute />, settings)}>
      <Route path="*" element={privateRoute(<ViewerRoute />, settings)} />
    </Route>
    <Route path="entity/:sharedId" element={privateRoute(<ViewerRoute />, settings)}>
      <Route path="*" element={privateRoute(<ViewerRoute />, settings)} />
    </Route>
    <Route path="entity/:sharedId/:tabView" element={privateRoute(<ViewerRoute />, settings)} />
    <Route path="entityv2/:sharedId" element={<Entity />} loader={entityLoader(headers)} />
    <Route path="error/:errorCode" element={<GeneralError />} />
    <Route path="404" element={<GeneralError />} />
    <Route path="page/:sharedId" element={<PageView />} />
    <Route path="page/:sharedId/:slug" element={<PageView />} />
    <Route path="setpassword/:key" element={<ResetPassword />} />
    <Route path="unlockaccount/:username/:code" element={<UnlockAccount />} />
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
      <Route path="preserve" element={adminsOnlyRoute(<Preserve />)} />
      <Route path="pages">
        <Route index element={adminsOnlyRoute(<PagesList />)} loader={pagesListLoader(headers)} />
        <Route
          path="new"
          element={adminsOnlyRoute(<PageEditor />)}
          loader={pageEditorLoader(headers)}
        />
        <Route
          path="edit/:sharedId?"
          element={adminsOnlyRoute(<PageEditor />)}
          loader={pageEditorLoader(headers)}
        />
      </Route>
      <Route path="templates">
        <Route index element={adminsOnlyRoute(<Templates />)} loader={templatesLoader(headers)} />
        <Route
          path="new"
          element={adminsOnlyRoute(<TemplatesEditor />)}
          loader={templatesEditorLoader(headers)}
        />
        <Route
          path="edit/:templateId"
          element={adminsOnlyRoute(<TemplatesEditor />)}
          loader={templatesEditorLoader(headers)}
        />
      </Route>
      <Route path="metadata_extraction">
        <Route
          index
          element={
            <ProtectedRoute allowedRoles={['admin', 'editor']}>
              <IXDashboard />
            </ProtectedRoute>
          }
          loader={IXdashboardLoader(headers)}
        />
        <Route
          path="suggestions/:extractorId"
          loader={IXSuggestionsLoader(headers)}
          element={
            <ProtectedRoute allowedRoles={['admin', 'editor']}>
              <IXSuggestions />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="paragraph-extraction">
        <Route
          loader={ParagraphExtractorLoader(headers)}
          index
          element={
            <ProtectedRoute allowedRoles={['admin', 'editor']}>
              <ParagraphExtractorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          loader={PXEntityLoader(headers)}
          path=":extractorId/entities"
          element={
            <ProtectedRoute allowedRoles={['admin', 'editor']}>
              <PXEntityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          loader={PXParagraphLoader(headers)}
          path=":extractorId/entities/:sharedId/paragraphs"
          element={
            <ProtectedRoute allowedRoles={['admin', 'editor']}>
              <PXParagraphDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="relationship-types">
        <Route
          index
          element={adminsOnlyRoute(<RelationshipTypes />)}
          loader={relationshipTypesLoader(headers)}
        />
      </Route>

      <Route path="thesauri">
        <Route index element={adminsOnlyRoute(<ThesauriList />)} loader={thesauriLoader(headers)} />
        <Route path="new" element={adminsOnlyRoute(<EditThesaurus />)} />
        <Route
          path="edit/:_id"
          element={adminsOnlyRoute(<EditThesaurus />)}
          loader={editThesaurusLoader(headers)}
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
        loader={activityLogLoader(headers, { settings })}
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
      <Route path="csv" element={adminsOnlyRoute(<CSVList />)} loader={csvListLoader(headers)} />
    </Route>
  </Route>
);

const languageLayout = (langKey: string, layout: React.JSX.Element) => (
  <Route key={langKey} path={langKey}>
    {layout}
    <Route path="*" element={<GeneralError />} />
  </Route>
);

const getRoutes = (
  settings: ClientSettings | undefined,
  userId: string | undefined,
  headers?: IncomingHttpHeaders,
  indexComponents?: IndexComponents
) => {
  const descriptor = getIndexDescriptor(settings, userId);
  const indexElement = buildIndexElement(descriptor, indexComponents);
  const parameters = descriptor.parameters;
  const defaultToLibrary = descriptor.defaultToLibrary;
  const layout = getRoutesLayout(settings, indexElement, headers, defaultToLibrary);
  const languageKeys = settings?.languages?.map(lang => lang.key) || [];
  return createRoutesFromElements(
    <Route
      path="/"
      element={<App customParams={parameters} />}
      errorElement={<RouteErrorBoundary />}
    >
      {layout}
      {languageKeys.map(langKey => languageLayout(langKey, layout))}
      <Route path="*" element={<GeneralError />} />
    </Route>
  );
};

const getIndexElement = (settings: ClientSettings | undefined, userId: string | undefined) => {
  const descriptor = getIndexDescriptor(settings, userId);
  return {
    element: buildIndexElement(descriptor),
    parameters: descriptor.parameters,
    defaultToLibrary: descriptor.defaultToLibrary,
  };
};

export type { IndexComponents };
export { getRoutes, getIndexElement };
