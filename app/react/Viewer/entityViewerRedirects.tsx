import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router';

/**
 * Always redirect /document/:sharedId(/*) → /entity/:sharedId (drop tabs + query).
 */
const RedirectDocumentToEntity = () => {
  const { sharedId } = useParams<{ sharedId: string }>();
  const { pathname } = useLocation();
  const to = pathname.replace(/\/document\/[^/]+.*/, `/entity/${sharedId}`);
  return <Navigate to={{ pathname: to, search: '', hash: '' }} replace />;
};

/**
 * When V2 owns /entity, old tab URLs (/entity/:id/info, /page, …) redirect to /entity/:id
 * and drop legacy query params.
 */
const RedirectEntityTabToEntity = () => {
  const { sharedId } = useParams<{ sharedId: string }>();
  const { pathname } = useLocation();
  const to = pathname.replace(/\/entity\/[^/]+.*/, `/entity/${sharedId}`);
  return <Navigate to={{ pathname: to, search: '', hash: '' }} replace />;
};

export { RedirectDocumentToEntity, RedirectEntityTabToEntity };
