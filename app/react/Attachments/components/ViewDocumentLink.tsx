import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CurrentLocationLink } from 'app/Layout';
import { EntitySchema } from 'shared/types/entityType';

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
