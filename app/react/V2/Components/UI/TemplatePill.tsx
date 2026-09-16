import React, { useMemo, type ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Translate, t } from '#app/I18N/index.js';
import { hexToRgb } from '#shared/utils/contrast.js';
import { useTemplatePillColors } from '#V2/theme/useTemplatePillColors.js';
import { ColorDot } from './ColorDot.js';

const accentRgba = (hex: string, alpha: number): string => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
};

type TemplatePillProps = {
  templateId: string;
  label?: ReactNode;
  size?: 'sm' | 'md';
};

const pillSizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
} as const;

const TemplatePill = ({ templateId, label, size = 'sm' }: TemplatePillProps) => {
  const templates = useAtomValue(templatesAtom);
  const template = useMemo(
    () => templates.find(item => item._id === templateId),
    [templateId, templates]
  );
  const { accentHex, background, foreground } = useTemplatePillColors(template?.color);
  const displayLabel =
    label ?? (template ? <Translate context={template._id}>{template.name}</Translate> : null);
  const titleKey = typeof label === 'string' ? label : template?.name;
  const title = titleKey ? t(template?._id ?? 'System', titleKey, null, false) : undefined;

  if (!displayLabel) {
    return null;
  }

  return (
    <span
      title={title}
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 whitespace-nowrap rounded-md font-medium ${pillSizeClasses[size]}`}
      style={{
        backgroundColor: background,
        color: foreground,
        border: `1px solid ${accentRgba(accentHex, 0.25)}`,
      }}
    >
      <ColorDot color={accentHex} size={size === 'md' ? 'md' : 'sm'} />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
};

export { TemplatePill };
