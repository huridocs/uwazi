import React from 'react';
import { Translate } from '#app/I18N/index.js';
import {
  getGroupLabel,
  type GroupLabelContext,
  type RelationshipsPanelGroupBy,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';

type RelationshipsGroupLabelProps = {
  groupKey: string;
  groupBy: RelationshipsPanelGroupBy;
  groupContext: GroupLabelContext;
  markers: RelationshipMarker[];
};

const RelationshipsGroupLabel = ({
  groupKey,
  groupBy,
  groupContext,
  markers,
}: RelationshipsGroupLabelProps) => {
  if (groupBy === 'direction') {
    if (groupKey === 'both') return <Translate>Bidirectional</Translate>;
    if (groupKey === 'incoming') return <Translate>Incoming</Translate>;
    return <Translate>Outgoing</Translate>;
  }

  if (groupBy === 'source-page') {
    if (groupKey === 'no-page') return <Translate>No page</Translate>;
    return (
      <>
        <Translate>Page</Translate> {groupKey}
      </>
    );
  }

  if (groupBy === 'target-template' || groupBy === 'source-template') {
    const name = groupContext.templateName(groupKey);
    if (!name || groupKey === 'unknown') return <Translate>Unknown template</Translate>;
    return <>{name}</>;
  }

  if (groupBy === 'target-entity') {
    const title = markers.find(marker => marker.target.sharedId === groupKey)?.target.title;
    if (!title) return <Translate>Unknown entity</Translate>;
    return <>{title}</>;
  }

  if (groupBy === 'source-entity') {
    return <>{groupContext.selfTitle}</>;
  }

  if (groupBy === 'relation-type') {
    const name = groupContext.relationshipTypeName(groupKey);
    if (!name || groupKey === 'no_label') return <>{groupKey}</>;
    return <>{name}</>;
  }

  return <>{getGroupLabel(groupKey, groupBy, groupContext, markers)}</>;
};

export { RelationshipsGroupLabel };
