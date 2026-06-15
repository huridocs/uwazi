import React from 'react';
import { Translate } from '#app/I18N/index.js';
import {
  describeGroupLabel,
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
  const descriptor = describeGroupLabel(groupKey, groupBy, groupContext, markers);

  if (descriptor.kind === 'translate') {
    return <Translate>{descriptor.key}</Translate>;
  }

  if (descriptor.kind === 'translatePage') {
    return (
      <>
        <Translate>Page</Translate> {descriptor.page}
      </>
    );
  }

  return <>{descriptor.value}</>;
};

export { RelationshipsGroupLabel };
