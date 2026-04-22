import React, { useMemo } from 'react';
import { Translate } from '#app/I18N/index.js';
import { getTextColor } from '../Formatters/index.js';

const TemplateLabel = ({
  label,
  templateId,
  color = '#A4CAFE',
}: {
  label: string;
  templateId?: string;
  color?: string;
}) => {
  const textColor = useMemo(() => getTextColor(color), [color]);

  if (!label) {
    return undefined;
  }

  return (
    <div
      className="text-xs font-medium px-2 py-1 rounded-sm w-fit"
      style={{ backgroundColor: color, color: textColor }}
    >
      <Translate context={templateId}>{label}</Translate>
    </div>
  );
};

export { TemplateLabel, getTextColor };
