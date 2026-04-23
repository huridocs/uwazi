import React, { useMemo } from 'react';
import { Translate } from '#app/I18N/index.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { getTextColor } from '../Formatters/index.js';

const defaultColor = '#A4CAFE';

const TemplateLabel = ({ template }: { template?: ClientTemplateSchema }) => {
  const textColor = useMemo(() => getTextColor(template?.color || defaultColor), [template]);

  if (!template) {
    return undefined;
  }

  return (
    <div
      className="text-xs font-medium px-2 py-1 rounded-sm w-fit"
      style={{ backgroundColor: template.color || defaultColor, color: textColor }}
    >
      <Translate context={template._id}>{template.name}</Translate>
    </div>
  );
};

export { TemplateLabel, getTextColor };
