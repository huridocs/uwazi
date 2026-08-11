import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Checkbox } from '#V2/Components/Forms/index.js';
import { MetadataCard } from '#V2/Components/Metadata/Components/MetadataCard.js';
import type { SyncTemplateConfig } from '../types.js';

type SyncTemplateCardProps = {
  templateId: string;
  config: SyncTemplateConfig;
  onChange: (next: SyncTemplateConfig) => void;
  onRemove: () => void;
};

const SyncTemplateCard = ({ templateId, config, onChange, onRemove }: SyncTemplateCardProps) => {
  const templates = useAtomValue(templatesAtom);
  const template = useMemo(
    () => templates.find(item => item._id === templateId),
    [templateId, templates]
  );

  if (!template) {
    return (
      <MetadataCard
        title={
          <span className="text-ink-secondary">
            <Translate>Unknown template</Translate>: {templateId}
          </span>
        }
      >
        <button
          type="button"
          onClick={onRemove}
          className="text-sm font-medium text-seal hover:underline"
        >
          <Translate>Remove</Translate>
        </button>
      </MetadataCard>
    );
  }

  const accentHex = template.color || '#888888';
  const properties = template.properties || [];
  const commonProperties = template.commonProperties || [];
  const allProperties = [...commonProperties, ...properties].filter(property => property._id);

  const toggleProperty = (propertyId: string) => {
    const selected = new Set(config.properties);
    if (selected.has(propertyId)) {
      selected.delete(propertyId);
    } else {
      selected.add(propertyId);
    }
    onChange({ ...config, properties: Array.from(selected) });
  };

  return (
    <div className="relative" data-testid={`sync-template-card-${templateId}`}>
      <MetadataCard
        className="h-full"
        icon={
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: accentHex }}
            aria-hidden
          />
        }
        title={<Translate context={template._id}>{template.name}</Translate>}
      >
        <button
          type="button"
          onClick={onRemove}
          className="absolute end-2 top-2 rounded-md p-1 text-ink-tertiary hover:bg-warm hover:text-ink"
          aria-label="Remove template from sync"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="flex flex-col gap-2 pt-1">
          <Checkbox
            name={`${templateId}-attachments`}
            checked={Boolean(config.attachments)}
            onChange={event => onChange({ ...config, attachments: event.currentTarget.checked })}
            label={<Translate>Sync files</Translate>}
          />

          {allProperties.map(property => {
            const propertyId = property._id!.toString();
            return (
              <Checkbox
                key={propertyId}
                name={`${templateId}-${propertyId}`}
                checked={config.properties.includes(propertyId)}
                onChange={() => toggleProperty(propertyId)}
                label={
                  <span className="text-sm text-ink">
                    <Translate context={template._id}>{property.label}</Translate>
                    <span className="ms-2 text-xs text-ink-tertiary">{property.type}</span>
                  </span>
                }
              />
            );
          })}
          {allProperties.length === 0 && (
            <p className="text-sm text-ink-secondary">
              <Translate>This template has no properties.</Translate>
            </p>
          )}
        </div>
      </MetadataCard>
    </div>
  );
};

export { SyncTemplateCard };
