import React from 'react';
import { Link, useLocation } from 'react-router';

import { EntitySchema } from '#shared/types/entityType.js';
import CurrentLocationLink from '#app/Layout/CurrentLocationLink.js';

type ViewDocumentLinkProps = {
  filename: string;
  entity: EntitySchema;
  children: React.ReactNode;
};

export const ViewDocumentLink = ({ filename, entity, children }: ViewDocumentLinkProps) => {
  const location = useLocation();
  const onViewer = location.pathname.match(/entity/);
  const onRelationshipsViewer = location.pathname.match(/relationships/);
  return onViewer && !onRelationshipsViewer ? (
    <CurrentLocationLink
      className="btn btn-default"
      location={location}
      queryParams={{ file: filename, page: 1 }}
      type="button"
      replace
    >
      {children}
    </CurrentLocationLink>
  ) : (
    <Link
      className="btn btn-default"
      to={`/entity/${entity.sharedId}?file=${filename}`}
      type="button"
    >
      {children}
    </Link>
  );
};
