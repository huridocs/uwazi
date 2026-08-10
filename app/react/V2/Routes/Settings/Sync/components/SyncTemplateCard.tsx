import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { effectiveThemeModeAtom, settingsAtom } from '#V2/atoms/index.js';
import { ColorDot, Button } from '#V2/Components/UI/index.js';
import { Checkbox } from '#V2/Components/Forms/index.js';
import { getTemplatePillColors, hexToRgb } from '#shared/utils/contrast.js';
import { appliedThemeAsInProvider } from '#V2/theme/themes.js';
import { getTemplatePillThemeAnchors } from '#V2/theme/templatePillTheme.js';
import type { SyncTemplateConfig } from '../types.js';

const accentRgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
};

type SyncTemplateCardProps = {
  templateId: string;
  config: SyncTemplateConfig;
  onChange: (next: SyncTemplateConfig) => void;
  onRemove: () => void;
};

const SyncTemplateCard = ({ templateId, config, onChange, onRemove }: SyncTemplateCardProps) => {
  const templates = useAtomValue(templatesAtom);
  const settings = useAtomValue(settingsAtom);
  const themeMode = useAtomValue(effectiveThemeModeAtom);
  const template = useMemo(
    () => templates.find(item => item._id === templateId),
    [templateId, templates]
  );

  const themeColors = useMemo(
    () =>
      appliedThemeAsInProvider(settings.themeVars ?? undefined, themeMode, {
        customizationOn: Boolean(settings.themeCustomization),
      }),
    [settings, themeMode]
  );

  if (!template) {
    return (
      <div className="rounded-xl border border-border bg-paper p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-ink-secondary">
            <Translate>Unknown template</Translate>: {templateId}
          </span>
          <Button type="button" variant="danger" size="small" onClick={onRemove}>
            <Translate>Remove</Translate>
          </Button>
        </div>
      </div>
    );
  }

  const { tintBase, accentHex } = getTemplatePillThemeAnchors(
    themeColors,
    themeMode,
    template.color
  );
  const { background, foreground } = getTemplatePillColors(accentHex, tintBase);
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
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        borderColor: accentRgba(accentHex, 0.35),
        backgroundColor: 'var(--color-theme-surface-raised, var(--color-theme-surface-muted))',
      }}
      data-testid={`sync-template-card-${templateId}`}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{
          backgroundColor: background,
          color: foreground,
          borderBottom: `1px solid ${accentRgba(accentHex, 0.25)}`,
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <ColorDot color={accentHex} size="md" />
          <span className="truncate text-sm font-semibold">
            <Translate context={template._id}>{template.name}</Translate>
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 hover:opacity-80"
          aria-label="Remove template from sync"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <Checkbox
          name={`${templateId}-attachments`}
          checked={Boolean(config.attachments)}
          onChange={event => onChange({ ...config, attachments: event.currentTarget.checked })}
          label={<Translate>Sync attachments</Translate>}
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
            <Translate>Properties to sync</Translate>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {allProperties.map(property => {
              const propertyId = property._id!.toString();
              return (
                <div
                  key={propertyId}
                  className="rounded-lg border border-border bg-paper px-3 py-2"
                >
                  <Checkbox
                    name={`${templateId}-${propertyId}`}
                    checked={config.properties.includes(propertyId)}
                    onChange={() => toggleProperty(propertyId)}
                    label={
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          <Translate context={template._id}>{property.label}</Translate>
                        </span>
                        <span className="text-xs text-ink-tertiary">{property.type}</span>
                      </span>
                    }
                  />
                </div>
              );
            })}
            {allProperties.length === 0 && (
              <p className="text-sm text-ink-secondary">
                <Translate>This template has no properties.</Translate>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { SyncTemplateCard };
