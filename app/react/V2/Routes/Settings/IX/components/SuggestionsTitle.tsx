import React from 'react';
import { Translate } from 'app/I18N';
import { Pill } from 'app/V2/Components/UI';
import { ClientTemplateSchema } from 'app/istore';

const SuggestionsTitle = ({
  propertyName,
  templates,
}: {
  propertyName: string;
  templates: ClientTemplateSchema[];
}) => {
  const allProperties = [...(templates[0].commonProperties || []), ...templates[0].properties];
  const template = allProperties.find(prop => prop.name === propertyName);
  let propGraphics = 'A';
  switch (template?.type) {
    case 'text':
      propGraphics = 'A';
      break;
    default:
      propGraphics = 'A';
  }
  return (
    <div className="flex space-x-2">
      <span className="font-sans text-center text-gray-700 bg-indigo-200 rounded-full w-7 h-7">
        {propGraphics}
      </span>
      <span>{template?.label}</span>
      <span className="italic font-light">
        <Translate>for</Translate>
      </span>
      {templates.map(template => (
        <Pill
          color="gray"
          className="inline-flex items-center text-xs font-medium"
          key={template._id}
        >
          {template.name}
        </Pill>
      ))}
    </div>
  );
};

export { SuggestionsTitle };
