import React, { type ReactElement, useMemo, useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import type { ClientProperty } from '#V2/shared/types.js';
import {
  RelationshipMetadataProperty,
  RelatedRelationshipMetadataProperty,
} from '#V2/formatters/types.js';
import { EntityOverlayPill, type OpenEntityTarget } from './EntityOverlayPill.js';
import { sortRelationshipValues } from './connectionPillsHelpers.js';

type RelationshipEntityValue = RelatedRelationshipMetadataProperty['values'][number];

type ConnectionPillsProps = {
  values: RelationshipEntityValue[];
  targetTemplateId?: string;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

type ConnectionPillsForFieldOptions = {
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const SHOWN_COUNT = 10;

const isEntityRelationshipValue = (
  value: RelationshipMetadataProperty['values'][number]
): value is RelationshipEntityValue => 'title' in value;

const ConnectionPills = ({ values, targetTemplateId, onOpenEntity }: ConnectionPillsProps) => {
  const [expanded, setExpanded] = useState(false);
  const sorted = useMemo(() => sortRelationshipValues(values), [values]);
  const overflows = sorted.length > SHOWN_COUNT;
  const shown = !overflows || expanded ? sorted : sorted.slice(0, SHOWN_COUNT);

  if (!sorted.length) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <ul className="flex min-w-0 flex-wrap items-center gap-1.5">
        {shown.map((value, index) => {
          const itemKey = value._id || `rel-${index}`;
          return (
            <li key={itemKey} className="min-w-0 max-w-full">
              <EntityOverlayPill
                sharedId={value._id}
                templateId={value.templateId || targetTemplateId || ''}
                label={value.title}
                icon={value.icon}
                authorized={value.authorized}
                onOpenEntity={onOpenEntity}
              />
            </li>
          );
        })}
      </ul>
      {overflows ? (
        <button
          type="button"
          aria-expanded={expanded}
          className="self-start text-xs font-medium text-ink-secondary underline underline-offset-2 hover:text-ink"
          onClick={() => setExpanded(current => !current)}
        >
          {expanded ? (
            <Translate>Show less</Translate>
          ) : (
            <>
              <Translate>Show all</Translate>
              {` ${sorted.length}`}
            </>
          )}
        </button>
      ) : null}
    </div>
  );
};

const connectionPillsForField = (
  field: RelationshipMetadataProperty,
  templateProperty: ClientProperty | undefined,
  options: ConnectionPillsForFieldOptions = {}
): ReactElement | null => {
  const values = field.values.filter(isEntityRelationshipValue);
  if (!values.length) {
    return null;
  }
  return (
    <ConnectionPills
      values={values}
      targetTemplateId={field.relationShipTarget || templateProperty?.content}
      onOpenEntity={options.onOpenEntity}
    />
  );
};

export { ConnectionPills, connectionPillsForField, isEntityRelationshipValue };
export type { ConnectionPillsProps, OpenEntityTarget, RelationshipEntityValue };
