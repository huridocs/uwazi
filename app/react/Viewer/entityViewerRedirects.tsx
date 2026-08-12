import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router';
import { getEntityViewerLegacyRedirect } from './entityViewerLegacyRedirect.js';

/**
 * TEMPORARY client-side safety net (issue #9522).
 * Prefer the SSR 301 in entry-server; these components cover in-app navigations
 * that never hit SSR. Remove with entityViewerLegacyRedirect.ts when V2 soft-deploy ends.
 */
const RedirectDocumentToEntity = () => {
  const { sharedId } = useParams<{ sharedId: string }>();
  const { pathname } = useLocation();
  const redirect =
    getEntityViewerLegacyRedirect(pathname) ||
    // Fallback if path helpers miss (should not happen for matched routes).
    ({ pathname: pathname.replace(/\/document\/[^/]+.*/, `/entity/${sharedId}`) } as const);
  return <Navigate to={{ pathname: redirect.pathname, search: '', hash: '' }} replace />;
};

/**
 * TEMPORARY client-side safety net (issue #9522) for /entity/:id/* when V2 owns /entity.
 */
const RedirectEntityTabToEntity = () => {
  const { sharedId } = useParams<{ sharedId: string }>();
  const { pathname } = useLocation();
  const redirect =
    getEntityViewerLegacyRedirect(pathname, { entityViewerV2: true }) ||
    ({ pathname: pathname.replace(/\/entity\/[^/]+.*/, `/entity/${sharedId}`) } as const);
  return <Navigate to={{ pathname: redirect.pathname, search: '', hash: '' }} replace />;
};

export { RedirectDocumentToEntity, RedirectEntityTabToEntity };
