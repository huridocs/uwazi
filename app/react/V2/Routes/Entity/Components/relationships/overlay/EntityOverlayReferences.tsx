import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { relationshipReferenceDisplay } from '../rows/useRelationshipRowData.js';
import { PageTag } from '../rows/PageTag.js';

type EntityOverlayReferencesProps = {
  markers: RelationshipMarker[];
  selfSharedId: string;
};

const EntityOverlayReferences = ({ markers, selfSharedId }: EntityOverlayReferencesProps) => {
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const rows = useMemo(
    () =>
      markers.map(marker => {
        const { referenceText, referencePage } = relationshipReferenceDisplay(marker, selfSharedId);
        const relationshipTypeName =
          relationshipTypes.find(type => type._id === marker.view.type)?.name ??
          marker.view.relationshipTypeName ??
          '';
        return { marker, referenceText, referencePage, relationshipTypeName };
      }),
    [markers, relationshipTypes, selfSharedId]
  );

  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
        <Translate>References in document</Translate>
      </h4>
      <div>
        {rows.map(({ marker, referenceText, referencePage, relationshipTypeName }) => (
          <div key={marker._id} className="border-b border-border/50 px-3 py-2.5 last:border-b-0">
            {referencePage !== undefined && (
              <div className="mb-1.5 flex items-start justify-end gap-2">
                <PageTag page={referencePage} />
              </div>
            )}
            {referenceText ? (
              <p className="line-clamp-2 text-xs leading-relaxed text-ink-secondary">
                {referenceText}
              </p>
            ) : (
              <p className="text-xs text-ink-tertiary">—</p>
            )}
            {relationshipTypeName && (
              <p className="mt-1 text-[10px] capitalize text-ink-tertiary">
                {relationshipTypeName}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export { EntityOverlayReferences };
