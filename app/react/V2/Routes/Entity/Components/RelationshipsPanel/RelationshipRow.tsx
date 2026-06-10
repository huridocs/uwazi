import React, { useEffect, useRef } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/Button.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { scrollToRelationshipPanelAtom } from '../atoms.js';

type RelationshipRowProps = {
  marker: RelationshipMarker;
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
};

const RelationshipRow = ({ marker, isSelected, onClick, onDelete }: RelationshipRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [scrollToRelationshipId, setScrollToRelationshipId] = useAtom(
    scrollToRelationshipPanelAtom
  );
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const entityTitle = marker.target.title || '-';
  const relationshipTypeName = relationshipTypes.find(type => type._id === marker.view.type)?.name;
  const referenceText = marker.anchor?.text?.trim() || '';
  const referencePage = marker.anchor?.selections?.[0]?.page;

  const surface = 'bg-(--color-theme-surface-raised)';
  const borderIdle =
    'border-[color-mix(in_srgb,var(--color-theme-border-default)_40%,transparent)]';
  const borderClass = isSelected ? 'border-2 border-(--color-theme-action-primary)' : borderIdle;
  useEffect(() => {
    if (scrollToRelationshipId !== marker._id) {
      return;
    }
    rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setScrollToRelationshipId(null);
  }, [marker._id, scrollToRelationshipId, setScrollToRelationshipId]);

  const cardClass = [
    'flex w-full cursor-pointer flex-col gap-(--spacing-theme-3) rounded-md border',
    'p-(--spacing-theme-3) shadow-(--color-theme-shadow-sm) transition-colors',
    'hover:bg-(--color-theme-surface-warm)',
    surface,
    borderClass,
  ].join(' ');

  return (
    <div
      ref={rowRef}
      className={cardClass}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-ink">{entityTitle}</h3>
        {relationshipTypeName && (
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/70">
            {relationshipTypeName}
          </p>
        )}
      </div>

      {referenceText && (
        <div className="flex flex-col gap-1">
          {referencePage && (
            <p className="text-xs font-medium text-ink/60">
              <Translate>Page</Translate> {referencePage}
            </p>
          )}
          <p className="line-clamp-4 text-sm leading-relaxed text-ink/80">{referenceText}</p>
        </div>
      )}

      <TemplateLabel templateId={marker.target.templateId} />

      <div className="flex justify-end gap-(--spacing-theme-2) mt-(--spacing-theme-2)">
        <Button
          variant="secondary"
          size="small"
          onClick={e => {
            e.stopPropagation();
            onDelete?.();
          }}
        >
          <Translate>Delete</Translate>
        </Button>
      </div>
    </div>
  );
};

export { RelationshipRow };
