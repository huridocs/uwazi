import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Translate } from '#app/I18N/index.js';
import { getTextColor } from '../helpers/getTextColor';

const defaultColor = '#A4CAFE';

const TemplateLabel = ({ templateId }: { templateId?: String }) => {
  const templates = useAtomValue(templatesAtom);
  const template = useMemo(
    () => templates.find(t => t._id === templateId),
    [templateId, templates]
  );

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

export { TemplateLabel };
