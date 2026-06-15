import React, { useMemo } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import {
  relationshipsPanelEntityTypeFiltersAtom,
  relationshipsPanelRelTypeFiltersAtom,
} from './relationshipsPanelFiltersAtom.js';
import { RelationshipsFacetSection } from './RelationshipsFacetSection.js';

type RelationshipsFilterDrawerContentProps = {
  sourceMarkers: RelationshipMarker[];
};

const RelationshipsFilterDrawerContent = ({
  sourceMarkers,
}: RelationshipsFilterDrawerContentProps) => {
  const [relTypeFilters, setRelTypeFilters] = useAtom(relationshipsPanelRelTypeFiltersAtom);
  const [entityTypeFilters, setEntityTypeFilters] = useAtom(
    relationshipsPanelEntityTypeFiltersAtom
  );
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);

  const { byRelType, byEntityType, totalRels } = useMemo(() => {
    const rel = new Map<string, number>();
    const ent = new Map<string, number>();
    sourceMarkers.forEach(marker => {
      rel.set(marker.view.type, (rel.get(marker.view.type) ?? 0) + 1);
      const templateId = marker.target.templateId || 'unknown';
      ent.set(templateId, (ent.get(templateId) ?? 0) + 1);
    });
    return { byRelType: rel, byEntityType: ent, totalRels: sourceMarkers.length };
  }, [sourceMarkers]);

  const relTypeName = (id: string) => relationshipTypes.find(type => type._id === id)?.name ?? id;
  const templateName = (id: string) => templates.find(template => template._id === id)?.name ?? id;
  const templateColor = (id: string) => templates.find(template => template._id === id)?.color;

  return (
    <>
      <RelationshipsFacetSection
        title={<Translate>Relation type</Translate>}
        total={totalRels}
        entries={Array.from(byRelType.entries()).sort((a, b) => b[1] - a[1])}
        selected={relTypeFilters}
        onToggle={id => setRelTypeFilters(current => ({ ...current, [id]: !current[id] }))}
        label={relTypeName}
        noLabelId="no_label"
        defaultExpanded
      />
      <RelationshipsFacetSection
        title={<Translate>Target entity type</Translate>}
        total={totalRels}
        entries={Array.from(byEntityType.entries()).sort((a, b) => b[1] - a[1])}
        selected={entityTypeFilters}
        onToggle={id => setEntityTypeFilters(current => ({ ...current, [id]: !current[id] }))}
        label={templateName}
        noLabelId="unknown"
        renderMarker={id => {
          const color = templateColor(id);
          return color ? (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: color }}
            />
          ) : null;
        }}
      />
    </>
  );
};

export { RelationshipsFilterDrawerContent };
