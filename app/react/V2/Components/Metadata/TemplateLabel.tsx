import React from 'react';
import { Translate } from 'app/I18N';

const TemplateLabel = ({
  label,
  templateId,
  color = '#A4CAFE',
}: {
  label: string;
  templateId?: string;
  color?: string;
}) => {
  if (!label) {
    return undefined;
  }

  return (
    <dd
      className="text-white mix-blend-difference py-1 px-2 w-fit rounded-md relative"
      style={{ backgroundColor: color }}
    >
      <Translate context={templateId}>{label}</Translate>
    </dd>
  );
};

export { TemplateLabel };
