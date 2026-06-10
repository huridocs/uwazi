import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/Button.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';

type RelationshipRowProps = {
  marker: RelationshipMarker;
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
};

const RelationshipRow = ({ marker, isSelected, onClick, onDelete }: RelationshipRowProps) => {
  const entityTitle = marker.target.title || '-';
  const referenceText = marker.anchor?.text || '';

  const surface = 'bg-(--color-theme-surface-raised)';
  const borderIdle =
    'border-[color-mix(in_srgb,var(--color-theme-border-default)_40%,transparent)]';
  const borderClass = isSelected ? 'border-2 border-(--color-theme-action-primary)' : borderIdle;
  const cardClass = [
    'flex w-full cursor-pointer flex-col gap-(--spacing-theme-3) rounded-md border',
    'p-(--spacing-theme-3) shadow-(--color-theme-shadow-sm) transition-colors',
    'hover:bg-(--color-theme-surface-warm)',
    surface,
    borderClass,
  ].join(' ');

  return (
    <div
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
      </div>

      {referenceText && (
        <p className="text-sm font-medium leading-relaxed text-ink">{referenceText}</p>
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
