import React from 'react';
import { ColorDot } from '#V2/Components/UI/ColorDot.js';
import { useTemplatePillColors } from '#V2/theme/useTemplatePillColors.js';

type TemplateOptionLabelProps = {
  name: string;
  color?: string;
};

const TemplateOptionLabel = ({ name, color }: TemplateOptionLabelProps) => {
  const { accentHex } = useTemplatePillColors(color);

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <ColorDot color={accentHex} size="md" />
      <span className="truncate normal-case text-ink">{name}</span>
    </span>
  );
};

export { TemplateOptionLabel };
