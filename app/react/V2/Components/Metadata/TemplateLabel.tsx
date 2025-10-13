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
    <div className="py-1 px-2 w-fit rounded-md relative" style={{ backgroundColor: color }}>
      <dd className="text-white mix-blend-difference">
        <Translate context={templateId}>{label}</Translate>
      </dd>
    </div>
  );
};

export { TemplateLabel };
