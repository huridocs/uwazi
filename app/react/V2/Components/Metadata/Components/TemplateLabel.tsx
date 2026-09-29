import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Translate, t } from '#app/I18N/index.js';
import { ColorDot } from '#V2/Components/UI/ColorDot.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { useTemplatePillColors } from '#V2/theme/useTemplatePillColors.js';

type TemplateLabelProps = {
  templateId?: string;
  variant?: 'pill' | 'tag';
};

const TemplateLabel = ({ templateId, variant = 'pill' }: TemplateLabelProps) => {
  const templates = useAtomValue(templatesAtom);
  const template = useMemo(
    () => templates.find(item => item._id === templateId),
    [templateId, templates]
  );
  const { accentHex } = useTemplatePillColors(template?.color);

  if (!templateId) {
    return undefined;
  }

  if (variant !== 'tag') {
    return <TemplatePill templateId={templateId} />;
  }

  if (!template) {
    return undefined;
  }

  return (
    <span
      title={t(template._id, template.name, null, false)}
      className="inline-flex max-w-full min-w-0 items-center gap-1.5"
    >
      <ColorDot color={accentHex} size="md" />
      <span className="truncate text-nano font-semibold uppercase tracking-[0.08em] text-ink-tertiary">
        <Translate context={template._id}>{template.name}</Translate>
      </span>
    </span>
  );
};

export { TemplateLabel };
