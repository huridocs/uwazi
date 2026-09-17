import React, { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Translate, t } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { getRelativeLuminanceFromHex } from '#shared/utils/contrast.js';
import { useTemplatePillColors } from '#V2/theme/useTemplatePillColors.js';
import { ColorDot } from './ColorDot.js';

type EntityTypeChipProps = {
  templateId?: string;
};

const typeChipSurface = (accentHex: string) => ({
  tint: `${accentHex}20`,
  border: `1px solid ${accentHex}40`,
  labelColor:
    getRelativeLuminanceFromHex(accentHex) > 0.6
      ? 'var(--text-primary)'
      : `color-mix(in srgb, ${accentHex} 55%, var(--text-primary))`,
});

const useTypeChip = (templateId?: string) => {
  const templates = useAtomValue(templatesAtom);
  const template = useMemo(
    () => templates.find(item => item._id === templateId),
    [templateId, templates]
  );
  const { accentHex } = useTemplatePillColors(template?.color);
  const [expanded, setExpanded] = useState(false);
  return { template, accentHex, expanded, setExpanded };
};

const EntityTypeChip = ({ templateId }: EntityTypeChipProps) => {
  const { template, accentHex, expanded, setExpanded } = useTypeChip(templateId);
  if (!templateId || !template) {
    return null;
  }

  const title = t(template._id, template.name, null, false);
  const { tint, border, labelColor } = typeChipSurface(accentHex);

  return (
    <span
      data-testid="entity-type-chip"
      title={title}
      className={`relative inline-flex shrink-0 items-center ${expanded ? 'z-10' : ''}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <span
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: tint, border }}
      >
        <ColorDot color={accentHex} size="chip" ring />
      </span>
      <span
        data-testid="entity-type-chip-label"
        className={`${
          expanded ? 'inline-flex' : 'hidden'
        } absolute start-0 top-1/2 h-6 -translate-y-1/2 items-center gap-1.5 rounded-md ps-1.5 pe-2.5 whitespace-nowrap shadow-sm`}
        style={{
          background: `linear-gradient(${tint}, ${tint}), var(--bg-surface, var(--color-paper))`,
          border,
          color: labelColor,
        }}
      >
        <ColorDot color={accentHex} size="chip" ring />
        <span className="text-xs font-medium">
          <Translate context={template._id}>{template.name}</Translate>
        </span>
      </span>
    </span>
  );
};

export type { EntityTypeChipProps };
export { EntityTypeChip };
