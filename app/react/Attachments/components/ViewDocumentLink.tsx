import React from 'react';
import { Link, useLocation } from 'react-router';
import { useAtomValue } from 'jotai';
import { CurrentLocationLink } from '#app/Layout/index.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import {
  buildEntityViewLink,
  isEntityPath,
  isEntityViewerV2Enabled,
  isLegacyEntityPath,
} from '#app/utils/entityViewerPaths.js';

type ViewDocumentLinkProps = {
  filename: string;
  entity: EntitySchema;
  children: React.ReactNode;
};

export const ViewDocumentLink = ({ filename, entity, children }: ViewDocumentLinkProps) => {
  const location = useLocation();
  const settings = useAtomValue(settingsAtom);
  const entityViewerV2 = isEntityViewerV2Enabled(settings.features);
  const onV1Viewer =
    isLegacyEntityPath(location.pathname) || (!entityViewerV2 && isEntityPath(location.pathname));
  const onRelationshipsViewer = location.pathname.match(/relationships/);

  if (onV1Viewer && !onRelationshipsViewer) {
    return (
      <CurrentLocationLink
        className="btn btn-default"
        location={location}
        queryParams={{ file: filename, page: 1 }}
        type="button"
        replace
      >
        {children}
      </CurrentLocationLink>
    );
  }

  return (
    <Link
      className="btn btn-default"
      to={
        entityViewerV2
          ? buildEntityViewLink({ sharedId: entity.sharedId!, entityViewerV2: true })
          : `/entity/${entity.sharedId}?file=${filename}`
      }
      type="button"
    >
      {children}
    </Link>
  );
};
