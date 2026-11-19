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
import { Login, SetPassword, UnlockAccount } from '#V2/Routes/Auth/index.js';
import { Login as LoginLegacy } from '#app/Users/Login.js';
import { ResetPassword } from '#app/Users/ResetPassword.js';
import { UnlockAccount as UnlockAccountLegacy } from '#app/Users/UnlockAccount.js';
import { isLoginV2Enabled } from '#shared/authReturn.js';
import { Users, createUsersLoader } from '#V2/Routes/Settings/Users/index.js';
import { Collection, collectionLoader } from '#V2/Routes/Settings/Collection/Collection.js';
import { Theming, themingLoader } from '#V2/Routes/Settings/Theming/Theming.js';
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
  createThesauriLoader,
  createEditThesaurusLoader,
  ThesauriList,
} from '#app/V2/Routes/Settings/Thesauri/index.js';
import { httpServices } from '#V2/services/http/index.js';
import type { V2Services } from '#V2/services/types.js';
import { MenuConfig, menuConfigloader } from '#V2/Routes/Settings/MenuConfig/MenuConfig.js';
import {
  RelationshipTypes,
  createRelationshipTypesLoader,
} from '#V2/Routes/Settings/RelationshipTypes/index.js';
import { LanguagesList, languagesListLoader } from '#V2/Routes/Settings/Languages/LanguagesList.js';
import { Account, createAccountLoader } from '#V2/Routes/Settings/Account/index.js';
import { IXdashboardLoader, IXDashboard } from '#V2/Routes/Settings/IX/IXDashboard.js';
import { IXSuggestions, IXSuggestionsLoader } from '#V2/Routes/Settings/IX/IXSuggestions.js';
import {
  PageEditor,
  pageEditorLoader,
  PagesList,
  pagesListLoader,
} from '#V2/Routes/Settings/Pages/index.js';
import {
  DatavizList,
  datavizListLoader,
  DatavizEditorRoute,
  datavizEditorLoader,
  datavizNewLoader,
} from '#V2/Routes/Settings/Dataviz/index.js';
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
  createTemplatesLoader,
  TemplatesEditor,
  createTemplatesEditorLoader,
} from '#V2/Routes/Settings/Templates/index.js';
import { Entity, entityLoader, shouldRevalidateEntity } from '#V2/Routes/Entity/index.js';
import { Library, createLibraryLoader } from '#V2/Routes/Library/index.js';
import {
  loggedInUsersRoute,
  adminsOnlyRoute,
  privateRoute,
  ProtectedRoute,
} from './ProtectedRoute.js';
import type { IndexDescriptor } from './getIndexElement.js';
import { getIndexDescriptor } from './getIndexElement.js';
import { PageView } from './Pages/PageView.js';
import { PageDraftView } from './Pages/PageDraftView.js';
import { NewRelMigrationDashboard } from './Settings/components/relV2MigrationDashboard.js';
import {
  CSVList,
  csvListLoader,
  UploadStatus,
  uploadStatusLoader,
} from './V2/Routes/Settings/CSVUpload/index.js';
import {
  RedirectDocumentToEntity,
  RedirectEntityTabToEntity,
} from './Viewer/entityViewerRedirects.js';
import { isEntityViewerV2Enabled } from './utils/entityViewerPaths.js';
import { isLibraryV2Enabled } from './utils/libraryPaths.js';

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

type IndexParts = {
  Root: IndexComponents['LibraryRoot'];
  Cards: IndexComponents['LibraryCards'];
  Table: IndexComponents['LibraryTable'];
  Map: IndexComponents['LibraryMap'];
  LoginComp: React.ComponentType;
};

const indexParts = (
  indexComponents: IndexComponents | undefined,
  settings: ClientSettings | undefined
): IndexParts => ({
  Root: indexComponents?.LibraryRoot ?? LibraryRoot,
  Cards: indexComponents?.LibraryCards ?? LibraryCards,
  Table: indexComponents?.LibraryTable ?? LibraryTable,
  Map: indexComponents?.LibraryMap ?? LibraryMap,
  LoginComp: indexComponents?.Login ?? (isLoginV2Enabled(settings?.features) ? Login : LoginLegacy),
});

const defaultLibraryViewElement = (
  parts: IndexParts,
  view: string | undefined,
  params: { q: string }
) => {
  switch (view) {
    case 'table':
      return (
        <parts.Root>
          <parts.Table params={params} />
        </parts.Root>
      );
    case 'map':
      return (
        <parts.Root>
          <parts.Map params={params} />
        </parts.Root>
      );
    default:
      return (
        <parts.Root>
          <parts.Cards params={params} />
        </parts.Root>
      );
  }
};

const libraryDefaultElement = (
  home: Extract<IndexDescriptor, { branch: 'libraryDefault' }>['libraryDefault'],
  parts: IndexParts,
  settings: ClientSettings | undefined
) => {
  const { userId, defaultLibraryView, private: privateInstance } = home;
  if (privateInstance && !userId) return <parts.LoginComp />;
  if (isLibraryV2Enabled(settings?.features)) return <Navigate to="library" replace />;
  return defaultLibraryViewElement(parts, defaultLibraryView, { q: '(includeUnpublished:!t)' });
};

const libraryV2Home = (customHomePage: string[], querySuffix: string) => {
  if (customHomePage.includes('map')) {
    return <Navigate to={`legacy-library/map${querySuffix}`} replace />;
  }
  if (customHomePage.includes('table')) {
    return <Navigate to={`legacy-library/table${querySuffix}`} replace />;
  }
  return <Navigate to={`library${querySuffix}`} replace />;
};

const legacyLibraryHome = (parts: IndexParts, customHomePage: string[], queryString: string) => {
  if (customHomePage.includes('map')) {
    return (
      <parts.Root>
        <parts.Map params={{ q: queryString }} />
      </parts.Root>
    );
  }
  if (customHomePage.includes('table')) {
    return (
      <parts.Root>
        <parts.Table params={{ q: queryString }} />
      </parts.Root>
    );
  }
  return (
    <parts.Root>
      <parts.Cards params={{ q: queryString }} />
    </parts.Root>
  );
};

const libraryCustomElement = (
  home: Extract<IndexDescriptor, { branch: 'libraryCustom' }>['libraryCustom'],
  parts: IndexParts,
  settings: ClientSettings | undefined
) => {
  const { customHomePage } = home;
  const [query] = customHomePage.filter((path: string) => path.startsWith('?'));
  const queryString = query ? deconstructSearchQuery(query) : '';
  const querySuffix = queryString ? `?q=${queryString}` : '';
  if (isLibraryV2Enabled(settings?.features)) return libraryV2Home(customHomePage, querySuffix);
  return legacyLibraryHome(parts, customHomePage, queryString);
};

const entityIndexElement = (
  entityId: string,
  settings: ClientSettings | undefined
): React.ReactNode => {
  if (isEntityViewerV2Enabled(settings?.features)) {
    return <Navigate to={`entity/${entityId}`} replace />;
  }
  return <ViewerRoute params={{ sharedId: entityId }} />;
};

const buildIndexElement = (
  descriptor: IndexDescriptor,
  indexComponents?: IndexComponents,
  settings?: ClientSettings
): React.ReactNode => {
  const parts = indexParts(indexComponents, settings);
  switch (descriptor.branch) {
    case 'libraryDefault':
      return libraryDefaultElement(descriptor.libraryDefault, parts, settings);
    case 'libraryCustom':
      return libraryCustomElement(descriptor.libraryCustom, parts, settings);
    case 'page':
      return <PageView params={{ sharedId: descriptor.pageId }} />;
    case 'entity':
      return entityIndexElement(descriptor.entityId, settings);
    case 'navigate':
      return <Navigate to={descriptor.navigateTo} />;
    default:
      return null;
  }
};

type RoutesLayoutInput = {
  settings: ClientSettings | undefined;
  indexElement: React.ReactNode;
  headers?: IncomingHttpHeaders;
  defaultToLibrary?: boolean;
  services?: V2Services;
};

const getRoutesLayout = ({
  settings,
  indexElement,
  headers,
  defaultToLibrary,
  services = httpServices,
}: RoutesLayoutInput) => (
  <Route errorElement={<RouteErrorBoundary />}>
    <Route index element={indexElement} handle={defaultToLibrary ? { library: true } : undefined} />
    <Route
      path="login"
      element={isLoginV2Enabled(settings?.features) ? <Login /> : <LoginLegacy />}
    />
    {isLibraryV2Enabled(settings?.features) ? (
      <>
        <Route
          path="library/*"
          element={<Library />}
          loader={createLibraryLoader(services)(headers)}
          handle={{ library: true }}
        />
        <Route path="legacy-library/*" element={privateRoute(<LibraryRoot />, settings)}>
          <Route
            index
            element={privateRoute(<LibraryCards />, settings)}
            handle={{ library: true }}
          />
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
      </>
    ) : (
      <>
        <Route path="library/*" element={privateRoute(<LibraryRoot />, settings)}>
          <Route
            index
            element={privateRoute(<LibraryCards />, settings)}
            handle={{ library: true }}
          />
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
        <Route
          path="libraryv2/*"
          element={<Library />}
          loader={createLibraryLoader(services)(headers)}
          handle={{ library: true }}
        />
      </>
    )}
    <Route path="document/:sharedId/*" element={<RedirectDocumentToEntity />} />
    {/*
      TEMPORARY soft-deploy (issue #9522): when featureFlagEntityViewerv2 is on, V2 owns
      /entity and unmatched /entity/:id/* paths redirect (SSR 301 + client Navigate).
      Remove with FEATURE_FLAG_ENTITY_VIEWER_V2 / entityViewerLegacyRedirect.ts once V1 is gone.
    */}
    {isEntityViewerV2Enabled(settings?.features) ? (
      <>
        <Route
          path="entity/:sharedId"
          element={<Entity />}
          loader={entityLoader(headers)}
          shouldRevalidate={shouldRevalidateEntity}
        />
        <Route path="entity/:sharedId/*" element={<RedirectEntityTabToEntity />} />
        <Route path="legacy-entity/:sharedId" element={privateRoute(<ViewerRoute />, settings)}>
          <Route path="*" element={privateRoute(<ViewerRoute />, settings)} />
        </Route>
        <Route
          path="legacy-entity/:sharedId/:tabView"
          element={privateRoute(<ViewerRoute />, settings)}
        />
      </>
    ) : (
      <>
        <Route path="entity/:sharedId" element={privateRoute(<ViewerRoute />, settings)}>
          <Route path="*" element={privateRoute(<ViewerRoute />, settings)} />
        </Route>
        <Route path="entity/:sharedId/:tabView" element={privateRoute(<ViewerRoute />, settings)} />
        <Route
          path="entityv2/:sharedId"
          element={<Entity />}
          loader={entityLoader(headers)}
          shouldRevalidate={shouldRevalidateEntity}
        />
      </>
    )}
    <Route path="error/:errorCode" element={<GeneralError />} />
    <Route path="404" element={<GeneralError />} />
    <Route path="page/:sharedId" element={<PageView />} />
    <Route path="page/:sharedId/:slug" element={<PageView />} />
    <Route path="page-draft/:sharedId" element={<PageDraftView />} />
    <Route path="page-draft/:sharedId/:slug" element={<PageDraftView />} />
    <Route
      path="setpassword/:key"
      element={isLoginV2Enabled(settings?.features) ? <SetPassword /> : <ResetPassword />}
    />
    <Route
      path="unlockaccount/:username/:code"
      element={isLoginV2Enabled(settings?.features) ? <UnlockAccount /> : <UnlockAccountLegacy />}
    />
    <Route path="settings" element={loggedInUsersRoute(<Settings />)}>
      <Route path="account" element={<Account />} loader={createAccountLoader(services)(headers)} />
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
        path="theming"
        element={adminsOnlyRoute(<Theming />)}
        loader={themingLoader(headers)}
      />
      <Route
        path="users"
        element={adminsOnlyRoute(<Users />)}
        loader={createUsersLoader(services)(headers)}
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
      <Route path="dataviz">
        <Route
          index
          element={adminsOnlyRoute(<DatavizList />)}
          loader={datavizListLoader(headers)}
        />
        <Route
          path="new"
          element={adminsOnlyRoute(<DatavizEditorRoute />)}
          loader={datavizNewLoader(headers)}
        />
        <Route
          path="edit/:id"
          element={adminsOnlyRoute(<DatavizEditorRoute />)}
          loader={datavizEditorLoader(headers)}
        />
      </Route>
      <Route path="templates">
        <Route
          index
          element={adminsOnlyRoute(<Templates />)}
          loader={createTemplatesLoader(services)(headers)}
        />
        <Route
          path="new"
          element={adminsOnlyRoute(<TemplatesEditor />)}
          loader={createTemplatesEditorLoader(services)(headers)}
        />
        <Route
          path="edit/:templateId"
          element={adminsOnlyRoute(<TemplatesEditor />)}
          loader={createTemplatesEditorLoader(services)(headers)}
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
          loader={createRelationshipTypesLoader(services)(headers)}
        />
      </Route>

      <Route path="thesauri">
        <Route
          index
          element={adminsOnlyRoute(<ThesauriList />)}
          loader={createThesauriLoader(services)(headers)}
        />
        <Route path="new" element={adminsOnlyRoute(<EditThesaurus />)} />
        <Route
          path="edit/:_id"
          element={adminsOnlyRoute(<EditThesaurus />)}
          loader={createEditThesaurusLoader(services)(headers)}
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
      <Route path="csv">
        <Route index element={adminsOnlyRoute(<CSVList />)} loader={csvListLoader(headers)} />
        <Route
          path=":entry"
          element={adminsOnlyRoute(<UploadStatus />)}
          loader={uploadStatusLoader(headers)}
        />
      </Route>
    </Route>
  </Route>
);

const languageLayout = (langKey: string, layout: React.JSX.Element) => (
  <Route key={langKey} path={langKey}>
    {layout}
    <Route path="*" element={<GeneralError />} />
  </Route>
);

const getRoutes = ({
  settings,
  userId,
  headers,
  indexComponents,
  services = httpServices,
}: {
  settings: ClientSettings | undefined;
  userId: string | undefined;
  headers?: IncomingHttpHeaders;
  indexComponents?: IndexComponents;
  services?: V2Services;
}) => {
  const descriptor = getIndexDescriptor(settings, userId);
  const indexElement = buildIndexElement(descriptor, indexComponents, settings);
  const { parameters } = descriptor;
  const { defaultToLibrary } = descriptor;
  const layout = getRoutesLayout({
    settings,
    indexElement,
    headers,
    defaultToLibrary,
    services,
  });
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
    element: buildIndexElement(descriptor, undefined, settings),
    parameters: descriptor.parameters,
    defaultToLibrary: descriptor.defaultToLibrary,
  };
};

export type { IndexComponents };
export { getRoutes, getIndexElement };
