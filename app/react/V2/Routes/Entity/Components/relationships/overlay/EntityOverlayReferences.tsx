/* eslint-disable react/no-multi-comp */
import React, { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import { FadeTruncate } from '#V2/Components/UI/FadeTruncate.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { PageTag } from '../rows/PageTag.js';
import { overlayReferenceDisplay } from './overlayReferenceDisplay.js';
import {
  OVERLAY_REFERENCES_VISIBLE_LIMIT,
  countReferenceItems,
  groupOverlayReferences,
  limitReferenceGroups,
  type OverlayReferenceRow,
} from './groupOverlayReferences.js';

type EntityOverlayReferencesProps = {
  markers: RelationshipMarker[];
  selfSharedId: string;
};

type ReferenceItemProps = {
  display: OverlayReferenceRow['display'];
  relationshipTypeName: string;
};

const ReferenceItem = ({ display, relationshipTypeName }: ReferenceItemProps) => (
  <div className="border-t border-border/30 px-3 py-2 first:border-t-0">
    {display.referenceText && (
      <>
        {display.referencePage !== undefined && (
          <div className="mb-1 flex items-start justify-end gap-2">
            <PageTag page={display.referencePage} />
          </div>
        )}
        <FadeTruncate
          text={display.referenceText}
          quoted
          fadeTo="var(--bg-warm)"
          className="text-xs leading-relaxed text-ink-secondary"
        />
      </>
    )}
    {relationshipTypeName && (
      <p
        className={`text-micro capitalize text-ink-tertiary ${display.referenceText ? 'mt-1' : ''}`}
      >
        {relationshipTypeName}
      </p>
    )}
  </div>
);

const EntityOverlayReferences = ({ markers, selfSharedId }: EntityOverlayReferencesProps) => {
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const [expanded, setExpanded] = useState(false);

  const groups = useMemo(() => {
    const rows: OverlayReferenceRow[] = markers.map(marker => {
      const display = overlayReferenceDisplay(marker, selfSharedId);
      const relationshipTypeName =
        relationshipTypes.find(type => type._id === marker.relationship.type)?.name ??
        marker.relationship.relationshipTypeName ??
        '';
      return { markerId: marker._id, display, relationshipTypeName };
    });
    return groupOverlayReferences(rows);
  }, [markers, relationshipTypes, selfSharedId]);

  const totalItems = countReferenceItems(groups);
  const hiddenCount = Math.max(0, totalItems - OVERLAY_REFERENCES_VISIBLE_LIMIT);
  const visibleGroups = expanded
    ? groups
    : limitReferenceGroups(groups, OVERLAY_REFERENCES_VISIBLE_LIMIT);

  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-micro font-semibold uppercase tracking-wider text-ink-tertiary">
        <Translate>References in document</Translate>
      </h4>
      <div>
        {visibleGroups.map(group => (
          <div key={group.sourceSharedId} className="border-b border-border/50 last:border-b-0">
            <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
              <span className="text-micro text-ink-tertiary">
                <Translate>From</Translate>
              </span>
              <TemplatePill
                templateId={group.sourceEntity.templateId}
                label={group.sourceEntity.title}
                size="sm"
              />
            </div>
            {group.items.map(item => (
              <ReferenceItem
                key={item.markerId}
                display={item.display}
                relationshipTypeName={item.relationshipTypeName}
              />
            ))}
          </div>
        ))}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          className="self-start px-3 text-micro font-medium text-ink-secondary transition-colors hover:text-ink"
          onClick={() => setExpanded(current => !current)}
        >
          {expanded ? <Translate>Show less</Translate> : <Translate>Show more</Translate>}
          {!expanded && <span className="text-ink-tertiary">{` (${hiddenCount})`}</span>}
        </button>
      )}
    </section>
  );
};

export { EntityOverlayReferences };
