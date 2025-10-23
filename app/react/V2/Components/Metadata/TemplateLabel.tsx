import React, { useMemo } from 'react';
import { Translate } from 'app/I18N';

const getTextColor = (backgroundHex: string): string => {
  if (!backgroundHex) {
    return '#000';
  }

  let hexColor = backgroundHex.replace('#', '').trim();

  if (hexColor.length === 3) {
    hexColor = hexColor
      .split('')
      .map(x => x + x)
      .join('');
  }

  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? '#000' : '#FFF';
};

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
      className="py-1 px-2 w-fit rounded-md"
      style={{ backgroundColor: color, color: textColor }}
    >
      <Translate context={templateId}>{label}</Translate>
    </div>
  );
};

export { TemplateLabel };
