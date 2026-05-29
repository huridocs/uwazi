/* eslint-disable max-lines */
import React from 'react';
import { createRoutesFromElements, Navigate, Route } from 'react-router';
import { IncomingHttpHeaders } from 'http';
import { App } from '#app/App/App.js';
import { RouteErrorBoundary, GeneralError } from '#V2/Components/ErrorHandling/index.js';
import { ClientSettings } from '#app/apiResponseTypes.js';
import type { IndexDescriptor } from './getIndexElement.js';
import { getIndexDescriptor } from './getIndexElement.js';
import {
  LibraryRoot,
  LibraryCards,
  LibraryTable,
  LibraryMap,
  Login,
  PageView,
  ViewerRoute,
} from './indexRouteComponents.js';
import { adminsOnlyRoute } from './ProtectedRoute.js';
import {
  lazyAdminsOnly,
  lazyComponent,
  lazyLoggedIn,
  lazyPrivate,
  lazyProtectedRoles,
  lazyWithLoader,
  lazyWithLoaderAndAction,
  type RouteContext,
} from './lazyRoute.js';
import { RoutePending } from './RoutePending.js';

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
  ctx: RouteContext,
  defaultToLibrary?: boolean
) => (
  <Route errorElement={<RouteErrorBoundary />} hydrateFallbackElement={<RoutePending />}>
    <Route
      index
      element={indexElement}
      {...(defaultToLibrary ? { handle: { library: true } } : {})}
    />
    <Route
      path="login"
      lazy={lazyComponent(async () => import('./Users/Login.js'), 'Login')}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="library/*"
      lazy={lazyPrivate(async () => import('./Library/Library.js'), 'LibraryRoot', ctx)}
      hydrateFallbackElement={<RoutePending />}
    >
      <Route
        index
        lazy={lazyPrivate(async () => import('./Library/LibraryCards.js'), 'LibraryCards', ctx)}
        handle={{ library: true }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="map"
        lazy={lazyPrivate(async () => import('./Library/LibraryMap.js'), 'LibraryMap', ctx)}
        handle={{ library: true }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="table"
        lazy={lazyPrivate(async () => import('./Library/LibraryTable.js'), 'LibraryTable', ctx)}
        handle={{ library: true }}
        hydrateFallbackElement={<RoutePending />}
      />
    </Route>
    <Route
      path="document/:sharedId"
      lazy={lazyPrivate(async () => import('./Viewer/ViewerRoute.js'), 'ViewerRoute', ctx)}
      hydrateFallbackElement={<RoutePending />}
    >
      <Route
        path="*"
        lazy={lazyPrivate(async () => import('./Viewer/ViewerRoute.js'), 'ViewerRoute', ctx)}
        hydrateFallbackElement={<RoutePending />}
      />
    </Route>
    <Route
      path="entity/:sharedId"
      lazy={lazyPrivate(async () => import('./Viewer/ViewerRoute.js'), 'ViewerRoute', ctx)}
      hydrateFallbackElement={<RoutePending />}
    >
      <Route
        path="*"
        lazy={lazyPrivate(async () => import('./Viewer/ViewerRoute.js'), 'ViewerRoute', ctx)}
        hydrateFallbackElement={<RoutePending />}
      />
    </Route>
    <Route
      path="entity/:sharedId/:tabView"
      lazy={lazyPrivate(async () => import('./Viewer/ViewerRoute.js'), 'ViewerRoute', ctx)}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="entityv2/:sharedId"
      lazy={lazyWithLoader(
        async () => import('#V2/Routes/Entity/Entity.js'),
        'Entity',
        async () => import('#V2/Routes/Entity/loader.js'),
        'entityLoader',
        ctx
      )}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route path="error/:errorCode" element={<GeneralError />} />
    <Route path="404" element={<GeneralError />} />
    <Route
      path="page/:sharedId"
      lazy={lazyComponent(async () => import('./Pages/PageView.js'), 'PageView')}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="page/:sharedId/:slug"
      lazy={lazyComponent(async () => import('./Pages/PageView.js'), 'PageView')}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="setpassword/:key"
      lazy={lazyComponent(async () => import('./Users/ResetPassword.js'), 'ResetPassword')}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="unlockaccount/:username/:code"
      lazy={lazyComponent(async () => import('./Users/UnlockAccount.js'), 'UnlockAccount')}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="settings"
      lazy={lazyLoggedIn(async () => import('#V2/Routes/Settings/Settings.js'), 'Settings')}
      hydrateFallbackElement={<RoutePending />}
    >
      <Route
        path="account"
        lazy={lazyWithLoader(
          async () => import('#V2/Routes/Settings/Account/Account.js'),
          'Account',
          async () => import('#V2/Routes/Settings/Account/Account.js'),
          'accountLoader',
          ctx
        )}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="dashboard"
        lazy={lazyAdminsOnly(
          async () => import('#V2/Routes/Settings/Dashboard/Dashboard.js'),
          'Dashboard',
          ctx,
          'dashboardLoader'
        )}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="navlinks"
        lazy={lazyAdminsOnly(
          async () => import('#V2/Routes/Settings/MenuConfig/MenuConfig.js'),
          'MenuConfig',
          ctx,
          'menuConfigloader'
        )}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="collection"
        lazy={lazyAdminsOnly(
          async () => import('#V2/Routes/Settings/Collection/Collection.js'),
          'Collection',
          ctx,
          'collectionLoader'
        )}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="users"
        lazy={lazyWithLoaderAndAction(
          async () => import('#V2/Routes/Settings/Users/Users.js'),
          'Users',
          async () => import('#V2/Routes/Settings/Users/Users.js'),
          'usersLoader',
          'userAction',
          ctx,
          Component => {
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return Wrapped;
          }
        )}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="preserve"
        lazy={lazyAdminsOnly(
          async () => import('#V2/Routes/Settings/Preserve/Preserve.js'),
          'Preserve',
          ctx
        )}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route path="pages">
        <Route
          index
          lazy={lazyAdminsOnly(
            async () => import('#V2/Routes/Settings/Pages/index.js'),
            'PagesList',
            ctx,
            'pagesListLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="new"
          lazy={lazyAdminsOnly(
            async () => import('#V2/Routes/Settings/Pages/index.js'),
            'PageEditor',
            ctx,
            'pageEditorLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="edit/:sharedId?"
          lazy={lazyAdminsOnly(
            async () => import('#V2/Routes/Settings/Pages/index.js'),
            'PageEditor',
            ctx,
            'pageEditorLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route path="templates">
        <Route
          index
          lazy={lazyAdminsOnly(
            async () => import('#V2/Routes/Settings/Templates/index.js'),
            'Templates',
            ctx,
            'templatesLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="new"
          lazy={lazyAdminsOnly(
            async () => import('#V2/Routes/Settings/Templates/index.js'),
            'TemplatesEditor',
            ctx,
            'templatesEditorLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="edit/:templateId"
          lazy={lazyAdminsOnly(
            async () => import('#V2/Routes/Settings/Templates/index.js'),
            'TemplatesEditor',
            ctx,
            'templatesEditorLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route path="metadata_extraction">
        <Route
          index
          lazy={lazyProtectedRoles(
            async () => import('#V2/Routes/Settings/IX/IXDashboard.js'),
            'IXDashboard',
            ['admin', 'editor'],
            ctx,
            async () => import('#V2/Routes/Settings/IX/IXDashboard.js'),
            'IXdashboardLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="suggestions/:extractorId"
          lazy={lazyProtectedRoles(
            async () => import('#V2/Routes/Settings/IX/IXSuggestions.js'),
            'IXSuggestions',
            ['admin', 'editor'],
            ctx,
            async () => import('#V2/Routes/Settings/IX/IXSuggestions.js'),
            'IXSuggestionsLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route path="paragraph-extraction">
        <Route
          index
          lazy={lazyProtectedRoles(
            async () => import('#V2/Routes/Settings/ParagraphExtraction/ParagraphExtraction.js'),
            'ParagraphExtractorDashboard',
            ['admin', 'editor'],
            ctx,
            async () => import('#V2/Routes/Settings/ParagraphExtraction/Loaders.js'),
            'ParagraphExtractorLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path=":extractorId/entities"
          lazy={lazyProtectedRoles(
            async () => import('#V2/Routes/Settings/ParagraphExtraction/PXEntities.js'),
            'PXEntityDashboard',
            ['admin', 'editor'],
            ctx,
            async () => import('#V2/Routes/Settings/ParagraphExtraction/Loaders.js'),
            'PXEntityLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path=":extractorId/entities/:sharedId/paragraphs"
          lazy={lazyProtectedRoles(
            async () => import('#V2/Routes/Settings/ParagraphExtraction/PXParagraphs.js'),
            'PXParagraphDashboard',
            ['admin', 'editor'],
            ctx,
            async () => import('#V2/Routes/Settings/ParagraphExtraction/Loaders.js'),
            'PXParagraphLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route path="relationship-types">
        <Route
          index
          lazy={lazyAdminsOnly(
            async () => import('#V2/Routes/Settings/RelationshipTypes/RelationshipTypes.js'),
            'RelationshipTypes',
            ctx,
            'relationshipTypesLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>

      <Route path="thesauri">
        <Route
          index
          lazy={lazyAdminsOnly(
            async () => import('#app/V2/Routes/Settings/Thesauri/index.js'),
            'ThesauriList',
            ctx,
            'thesauriLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="new"
          lazy={lazyAdminsOnly(
            async () => import('#app/V2/Routes/Settings/Thesauri/index.js'),
            'EditThesaurus',
            ctx
          )}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="edit/:_id"
          lazy={lazyAdminsOnly(
            async () => import('#app/V2/Routes/Settings/Thesauri/index.js'),
            'EditThesaurus',
            ctx,
            'editThesaurusLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route
        path="languages"
        lazy={lazyAdminsOnly(
          async () => import('#V2/Routes/Settings/Languages/LanguagesList.js'),
          'LanguagesList',
          ctx,
          'languagesListLoader'
        )}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route path="translations">
        <Route
          index
          lazy={lazyAdminsOnly(
            async () => import('#V2/Routes/Settings/Translations/TranslationsList.js'),
            'TranslationsList',
            ctx,
            'translationsListLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="edit/:context"
          lazy={lazyWithLoaderAndAction(
            async () => import('#V2/Routes/Settings/Translations/EditTranslations.js'),
            'EditTranslations',
            async () => import('#V2/Routes/Settings/Translations/EditTranslations.js'),
            'editTranslationsLoader',
            'editTranslationsAction',
            ctx,
            Component => {
              const Wrapped = () => adminsOnlyRoute(<Component />);
              return Wrapped;
            }
          )}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route
        path="filters"
        lazy={lazyAdminsOnly(
          async () => import('#V2/Routes/Settings/Filters/index.js'),
          'FiltersTable',
          ctx,
          'filtersLoader'
        )}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="customisation"
        lazy={lazyAdminsOnly(
          async () => import('#V2/Routes/Settings/Customization/Customization.js'),
          'Customisation',
          ctx,
          'customisationLoader'
        )}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="activitylog"
        lazy={async () => {
          const mod = await import('#V2/Routes/Settings/ActivityLog/index.js');
          const Component = mod.ActivityLog;
          const Wrapped = () => adminsOnlyRoute(<Component />);
          return {
            Component: Wrapped,
            loader: mod.activityLogLoader(ctx.headers, { settings: ctx.settings }),
          };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="custom-uploads"
        lazy={lazyAdminsOnly(
          async () => import('#V2/Routes/Settings/CustomUploads/CustomUploads.js'),
          'CustomUploads',
          ctx,
          'customUploadsLoader'
        )}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="newrelmigration"
        lazy={async () => {
          if (settings?.features?.newRelationships) {
            const mod = await import('./Settings/components/relV2MigrationDashboard.js');
            return { Component: mod.NewRelMigrationDashboard };
          }
          return { Component: GeneralError };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route path="csv">
        <Route
          index
          lazy={lazyAdminsOnly(
            async () => import('./V2/Routes/Settings/CSVUpload/index.js'),
            'CSVList',
            ctx,
            'csvListLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path=":entry"
          lazy={lazyAdminsOnly(
            async () => import('./V2/Routes/Settings/CSVUpload/index.js'),
            'UploadStatus',
            ctx,
            'uploadStatusLoader'
          )}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
    </Route>
  </Route>
);

const languageLayout = (langKey: string, layout: React.JSX.Element) => (
  <Route key={langKey} path={langKey} hydrateFallbackElement={<RoutePending />}>
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
  const ctx: RouteContext = { headers, settings };
  const descriptor = getIndexDescriptor(settings, userId);
  const indexElement = buildIndexElement(descriptor, indexComponents);
  const { parameters } = descriptor;
  const { defaultToLibrary } = descriptor;
  const layout = getRoutesLayout(settings, indexElement, ctx, defaultToLibrary);
  const languageKeys = settings?.languages?.map(lang => lang.key) || [];
  return createRoutesFromElements(
    <Route
      path="/"
      element={<App customParams={parameters} />}
      errorElement={<RouteErrorBoundary />}
      hydrateFallbackElement={<RoutePending />}
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
