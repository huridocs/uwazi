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
import {
  adminsOnlyRoute,
  loggedInUsersRoute,
  privateRoute,
  ProtectedRoute,
} from './ProtectedRoute.js';
import { RoutePending } from './RoutePending.js';

type RouteContext = {
  headers?: IncomingHttpHeaders;
  settings?: ClientSettings;
};

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
      lazy={async () => {
        const mod = await import('./Users/Login.js');
        return { Component: mod.Login };
      }}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="library/*"
      lazy={async () => {
        const mod = await import('./Library/Library.js');
        const Component = mod.LibraryRoot;
        const Wrapped = () => privateRoute(<Component />, ctx.settings);
        return { Component: Wrapped };
      }}
      hydrateFallbackElement={<RoutePending />}
    >
      <Route
        index
        lazy={async () => {
          const mod = await import('./Library/LibraryCards.js');
          const Component = mod.LibraryCards;
          const Wrapped = () => privateRoute(<Component />, ctx.settings);
          return { Component: Wrapped };
        }}
        handle={{ library: true }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="map"
        lazy={async () => {
          const mod = await import('./Library/LibraryMap.js');
          const Component = mod.LibraryMap;
          const Wrapped = () => privateRoute(<Component />, ctx.settings);
          return { Component: Wrapped };
        }}
        handle={{ library: true }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="table"
        lazy={async () => {
          const mod = await import('./Library/LibraryTable.js');
          const Component = mod.LibraryTable;
          const Wrapped = () => privateRoute(<Component />, ctx.settings);
          return { Component: Wrapped };
        }}
        handle={{ library: true }}
        hydrateFallbackElement={<RoutePending />}
      />
    </Route>
    <Route
      path="document/:sharedId"
      lazy={async () => {
        const mod = await import('./Viewer/ViewerRoute.js');
        const Component = mod.ViewerRoute;
        const Wrapped = () => privateRoute(<Component />, ctx.settings);
        return { Component: Wrapped };
      }}
      hydrateFallbackElement={<RoutePending />}
    >
      <Route
        path="*"
        lazy={async () => {
          const mod = await import('./Viewer/ViewerRoute.js');
          const Component = mod.ViewerRoute;
          const Wrapped = () => privateRoute(<Component />, ctx.settings);
          return { Component: Wrapped };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
    </Route>
    <Route
      path="entity/:sharedId"
      lazy={async () => {
        const mod = await import('./Viewer/ViewerRoute.js');
        const Component = mod.ViewerRoute;
        const Wrapped = () => privateRoute(<Component />, ctx.settings);
        return { Component: Wrapped };
      }}
      hydrateFallbackElement={<RoutePending />}
    >
      <Route
        path="*"
        lazy={async () => {
          const mod = await import('./Viewer/ViewerRoute.js');
          const Component = mod.ViewerRoute;
          const Wrapped = () => privateRoute(<Component />, ctx.settings);
          return { Component: Wrapped };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
    </Route>
    <Route
      path="entity/:sharedId/:tabView"
      lazy={async () => {
        const mod = await import('./Viewer/ViewerRoute.js');
        const Component = mod.ViewerRoute;
        const Wrapped = () => privateRoute(<Component />, ctx.settings);
        return { Component: Wrapped };
      }}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="entityv2/:sharedId"
      lazy={async () => {
        const [entityMod, loaderMod] = await Promise.all([
          import('#V2/Routes/Entity/Entity.js'),
          import('#V2/Routes/Entity/loader.js'),
        ]);
        return {
          Component: entityMod.Entity,
          loader: loaderMod.entityLoader(ctx.headers),
        };
      }}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route path="error/:errorCode" element={<GeneralError />} />
    <Route path="404" element={<GeneralError />} />
    <Route
      path="page/:sharedId"
      lazy={async () => {
        const mod = await import('./Pages/PageView.js');
        return { Component: mod.PageView };
      }}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="page/:sharedId/:slug"
      lazy={async () => {
        const mod = await import('./Pages/PageView.js');
        return { Component: mod.PageView };
      }}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="setpassword/:key"
      lazy={async () => {
        const mod = await import('./Users/ResetPassword.js');
        return { Component: mod.ResetPassword };
      }}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="unlockaccount/:username/:code"
      lazy={async () => {
        const mod = await import('./Users/UnlockAccount.js');
        return { Component: mod.UnlockAccount };
      }}
      hydrateFallbackElement={<RoutePending />}
    />
    <Route
      path="settings"
      lazy={async () => {
        const mod = await import('#V2/Routes/Settings/Settings.js');
        const Component = mod.Settings;
        const Wrapped = () => loggedInUsersRoute(<Component />);
        return { Component: Wrapped };
      }}
      hydrateFallbackElement={<RoutePending />}
    >
      <Route
        path="account"
        lazy={async () => {
          const mod = await import('#V2/Routes/Settings/Account/Account.js');
          return {
            Component: mod.Account,
            loader: mod.accountLoader(ctx.headers),
          };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="dashboard"
        lazy={async () => {
          const mod = await import('#V2/Routes/Settings/Dashboard/Dashboard.js');
          const Component = mod.Dashboard;
          const Wrapped = () => adminsOnlyRoute(<Component />);
          return {
            Component: Wrapped,
            loader: mod.dashboardLoader(ctx.headers),
          };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="navlinks"
        lazy={async () => {
          const mod = await import('#V2/Routes/Settings/MenuConfig/MenuConfig.js');
          const Component = mod.MenuConfig;
          const Wrapped = () => adminsOnlyRoute(<Component />);
          return {
            Component: Wrapped,
            loader: mod.menuConfigloader(ctx.headers),
          };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="collection"
        lazy={async () => {
          const mod = await import('#V2/Routes/Settings/Collection/Collection.js');
          const Component = mod.Collection;
          const Wrapped = () => adminsOnlyRoute(<Component />);
          return {
            Component: Wrapped,
            loader: mod.collectionLoader(ctx.headers),
          };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="users"
        lazy={async () => {
          const mod = await import('#V2/Routes/Settings/Users/Users.js');
          const Component = mod.Users;
          const Wrapped = () => adminsOnlyRoute(<Component />);
          return {
            Component: Wrapped,
            loader: mod.usersLoader(ctx.headers),
            action: mod.userAction(),
          };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="preserve"
        lazy={async () => {
          const mod = await import('#V2/Routes/Settings/Preserve/Preserve.js');
          const Component = mod.Preserve;
          const Wrapped = () => adminsOnlyRoute(<Component />);
          return { Component: Wrapped };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route path="pages">
        <Route
          index
          lazy={async () => {
            const mod = await import('#V2/Routes/Settings/Pages/index.js');
            const Component = mod.PagesList;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.pagesListLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="new"
          lazy={async () => {
            const mod = await import('#V2/Routes/Settings/Pages/index.js');
            const Component = mod.PageEditor;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.pageEditorLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="edit/:sharedId?"
          lazy={async () => {
            const mod = await import('#V2/Routes/Settings/Pages/index.js');
            const Component = mod.PageEditor;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.pageEditorLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route path="templates">
        <Route
          index
          lazy={async () => {
            const mod = await import('#V2/Routes/Settings/Templates/index.js');
            const Component = mod.Templates;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.templatesLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="new"
          lazy={async () => {
            const mod = await import('#V2/Routes/Settings/Templates/index.js');
            const Component = mod.TemplatesEditor;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.templatesEditorLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="edit/:templateId"
          lazy={async () => {
            const mod = await import('#V2/Routes/Settings/Templates/index.js');
            const Component = mod.TemplatesEditor;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.templatesEditorLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route path="metadata_extraction">
        <Route
          index
          lazy={async () => {
            const mod = await import('#V2/Routes/Settings/IX/IXDashboard.js');
            const Component = mod.IXDashboard;
            const Wrapped = () => (
              <ProtectedRoute allowedRoles={['admin', 'editor']}>
                <Component />
              </ProtectedRoute>
            );
            return {
              Component: Wrapped,
              loader: mod.IXdashboardLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="suggestions/:extractorId"
          lazy={async () => {
            const mod = await import('#V2/Routes/Settings/IX/IXSuggestions.js');
            const Component = mod.IXSuggestions;
            const Wrapped = () => (
              <ProtectedRoute allowedRoles={['admin', 'editor']}>
                <Component />
              </ProtectedRoute>
            );
            return {
              Component: Wrapped,
              loader: mod.IXSuggestionsLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route path="paragraph-extraction">
        <Route
          index
          lazy={async () => {
            const [componentMod, loaderMod] = await Promise.all([
              import('#V2/Routes/Settings/ParagraphExtraction/ParagraphExtraction.js'),
              import('#V2/Routes/Settings/ParagraphExtraction/Loaders.js'),
            ]);
            const Component = componentMod.ParagraphExtractorDashboard;
            const Wrapped = () => (
              <ProtectedRoute allowedRoles={['admin', 'editor']}>
                <Component />
              </ProtectedRoute>
            );
            return {
              Component: Wrapped,
              loader: loaderMod.ParagraphExtractorLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path=":extractorId/entities"
          lazy={async () => {
            const [componentMod, loaderMod] = await Promise.all([
              import('#V2/Routes/Settings/ParagraphExtraction/PXEntities.js'),
              import('#V2/Routes/Settings/ParagraphExtraction/Loaders.js'),
            ]);
            const Component = componentMod.PXEntityDashboard;
            const Wrapped = () => (
              <ProtectedRoute allowedRoles={['admin', 'editor']}>
                <Component />
              </ProtectedRoute>
            );
            return {
              Component: Wrapped,
              loader: loaderMod.PXEntityLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path=":extractorId/entities/:sharedId/paragraphs"
          lazy={async () => {
            const [componentMod, loaderMod] = await Promise.all([
              import('#V2/Routes/Settings/ParagraphExtraction/PXParagraphs.js'),
              import('#V2/Routes/Settings/ParagraphExtraction/Loaders.js'),
            ]);
            const Component = componentMod.PXParagraphDashboard;
            const Wrapped = () => (
              <ProtectedRoute allowedRoles={['admin', 'editor']}>
                <Component />
              </ProtectedRoute>
            );
            return {
              Component: Wrapped,
              loader: loaderMod.PXParagraphLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route path="relationship-types">
        <Route
          index
          lazy={async () => {
            const mod = await import('#V2/Routes/Settings/RelationshipTypes/RelationshipTypes.js');
            const Component = mod.RelationshipTypes;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.relationshipTypesLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>

      <Route path="thesauri">
        <Route
          index
          lazy={async () => {
            const mod = await import('#app/V2/Routes/Settings/Thesauri/index.js');
            const Component = mod.ThesauriList;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.thesauriLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="new"
          lazy={async () => {
            const mod = await import('#app/V2/Routes/Settings/Thesauri/index.js');
            const Component = mod.EditThesaurus;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return { Component: Wrapped };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="edit/:_id"
          lazy={async () => {
            const mod = await import('#app/V2/Routes/Settings/Thesauri/index.js');
            const Component = mod.EditThesaurus;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.editThesaurusLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route
        path="languages"
        lazy={async () => {
          const mod = await import('#V2/Routes/Settings/Languages/LanguagesList.js');
          const Component = mod.LanguagesList;
          const Wrapped = () => adminsOnlyRoute(<Component />);
          return {
            Component: Wrapped,
            loader: mod.languagesListLoader(ctx.headers),
          };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route path="translations">
        <Route
          index
          lazy={async () => {
            const mod = await import('#V2/Routes/Settings/Translations/TranslationsList.js');
            const Component = mod.TranslationsList;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.translationsListLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path="edit/:context"
          lazy={async () => {
            const mod = await import('#V2/Routes/Settings/Translations/EditTranslations.js');
            const Component = mod.EditTranslations;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.editTranslationsLoader(ctx.headers),
              action: mod.editTranslationsAction(),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
      </Route>
      <Route
        path="filters"
        lazy={async () => {
          const mod = await import('#V2/Routes/Settings/Filters/index.js');
          const Component = mod.FiltersTable;
          const Wrapped = () => adminsOnlyRoute(<Component />);
          return {
            Component: Wrapped,
            loader: mod.filtersLoader(ctx.headers),
          };
        }}
        hydrateFallbackElement={<RoutePending />}
      />
      <Route
        path="customisation"
        lazy={async () => {
          const mod = await import('#V2/Routes/Settings/Customization/Customization.js');
          const Component = mod.Customisation;
          const Wrapped = () => adminsOnlyRoute(<Component />);
          return {
            Component: Wrapped,
            loader: mod.customisationLoader(ctx.headers),
          };
        }}
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
        lazy={async () => {
          const mod = await import('#V2/Routes/Settings/CustomUploads/CustomUploads.js');
          const Component = mod.CustomUploads;
          const Wrapped = () => adminsOnlyRoute(<Component />);
          return {
            Component: Wrapped,
            loader: mod.customUploadsLoader(ctx.headers),
          };
        }}
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
          lazy={async () => {
            const mod = await import('./V2/Routes/Settings/CSVUpload/index.js');
            const Component = mod.CSVList;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.csvListLoader(ctx.headers),
            };
          }}
          hydrateFallbackElement={<RoutePending />}
        />
        <Route
          path=":entry"
          lazy={async () => {
            const mod = await import('./V2/Routes/Settings/CSVUpload/index.js');
            const Component = mod.UploadStatus;
            const Wrapped = () => adminsOnlyRoute(<Component />);
            return {
              Component: Wrapped,
              loader: mod.uploadStatusLoader(ctx.headers),
            };
          }}
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
