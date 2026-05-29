import React from 'react';
import type { ActionFunction, LazyRouteFunction, LoaderFunction, RouteObject } from 'react-router';
import type { IncomingHttpHeaders } from 'http';
import type { ClientSettings } from '#app/apiResponseTypes.js';
import {
  adminsOnlyRoute,
  loggedInUsersRoute,
  privateRoute,
  ProtectedRoute,
} from './ProtectedRoute.js';

export type RouteContext = {
  headers?: IncomingHttpHeaders;
  settings?: ClientSettings;
};

type RouteModule = Record<string, unknown>;

type ModuleImport = () => Promise<RouteModule>;

function pickExport<T>(mod: RouteModule, name: string): T {
  const value = mod[name] ?? mod.default;
  if (value === undefined) {
    throw new Error(`lazyRoute: missing export "${name}"`);
  }
  return value as T;
}

const wrapComponent = (
  Component: React.ComponentType,
  wrap?: (component: React.ComponentType) => React.ComponentType
) => (wrap ? wrap(Component) : Component);

export const lazyComponent = (
  importFn: ModuleImport,
  exportName: string,
  wrap?: (component: React.ComponentType) => React.ComponentType
): LazyRouteFunction<RouteObject> => {
  return async () => {
    const mod = await importFn();
    const Component = pickExport<React.ComponentType>(mod, exportName);
    return { Component: wrapComponent(Component, wrap) };
  };
};

export const lazyWithLoader = (
  componentImport: ModuleImport,
  componentName: string,
  loaderImport: ModuleImport,
  loaderExport: string,
  ctx: RouteContext,
  wrap?: (component: React.ComponentType) => React.ComponentType
): LazyRouteFunction<RouteObject> => {
  return async () => {
    const [componentMod, loaderMod] = await Promise.all([componentImport(), loaderImport()]);
    const Component = pickExport<React.ComponentType>(componentMod, componentName);
    const loaderFactory = pickExport<(headers?: IncomingHttpHeaders) => LoaderFunction>(
      loaderMod,
      loaderExport
    );
    return {
      Component: wrapComponent(Component, wrap),
      loader: loaderFactory(ctx.headers),
    };
  };
};

export const lazyWithLoaderAndAction = (
  componentImport: ModuleImport,
  componentName: string,
  moduleImport: ModuleImport,
  loaderExport: string,
  actionExport: string,
  ctx: RouteContext,
  wrap?: (component: React.ComponentType) => React.ComponentType
): LazyRouteFunction<RouteObject> => {
  return async () => {
    const [componentMod, mod] = await Promise.all([componentImport(), moduleImport()]);
    const Component = pickExport<React.ComponentType>(componentMod, componentName);
    const loaderFactory = pickExport<(headers?: IncomingHttpHeaders) => LoaderFunction>(
      mod,
      loaderExport
    );
    const actionFactory = pickExport<() => ActionFunction>(mod, actionExport);
    return {
      Component: wrapComponent(Component, wrap),
      loader: loaderFactory(ctx.headers),
      action: actionFactory(),
    };
  };
};

export const lazyAdminsOnly = (
  importFn: ModuleImport,
  exportName: string,
  ctx: RouteContext,
  loaderExport?: string
): LazyRouteFunction<RouteObject> => {
  const wrap = (Component: React.ComponentType) => {
    const Wrapped = () => adminsOnlyRoute(<Component />);
    return Wrapped;
  };

  if (loaderExport) {
    return lazyWithLoader(importFn, exportName, importFn, loaderExport, ctx, wrap);
  }

  return lazyComponent(importFn, exportName, wrap);
};

export const lazyPrivate = (
  importFn: ModuleImport,
  exportName: string,
  ctx: RouteContext
): LazyRouteFunction<RouteObject> =>
  lazyComponent(importFn, exportName, Component => {
    const Wrapped = () => privateRoute(<Component />, ctx.settings);
    return Wrapped;
  });

export const lazyLoggedIn = (
  importFn: ModuleImport,
  exportName: string
): LazyRouteFunction<RouteObject> =>
  lazyComponent(importFn, exportName, Component => {
    const Wrapped = () => loggedInUsersRoute(<Component />);
    return Wrapped;
  });

export const lazyProtectedRoles = (
  importFn: ModuleImport,
  exportName: string,
  roles: string[],
  ctx: RouteContext,
  loaderImport?: ModuleImport,
  loaderExport?: string
): LazyRouteFunction<RouteObject> => {
  const wrap = (Component: React.ComponentType) => {
    const Wrapped = () => (
      <ProtectedRoute allowedRoles={roles}>
        <Component />
      </ProtectedRoute>
    );
    return Wrapped;
  };

  if (loaderImport && loaderExport) {
    return lazyWithLoader(importFn, exportName, loaderImport, loaderExport, ctx, wrap);
  }

  return lazyComponent(importFn, exportName, wrap);
};
