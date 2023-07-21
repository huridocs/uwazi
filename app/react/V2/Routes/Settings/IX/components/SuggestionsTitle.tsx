import React from 'react';
import { CalendarDaysIcon, HashtagIcon } from '@heroicons/react/20/solid';
import {} from '@heroicons/react/24/solid';
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
  let propGraphics: string | React.ReactNode = '_';
  switch (template?.type) {
    case 'text':
      propGraphics = '_';
      break;
    case 'date':
      propGraphics = <CalendarDaysIcon className="w-3" />;
      break;
    case 'numeric':
      propGraphics = <HashtagIcon className="w-3" />;
      break;
    default:
      propGraphics = '_';
  }
  return (
    <div className="flex space-x-2">
      <span className="flex items-center justify-center font-sans text-sm text-center text-gray-700 bg-indigo-200 rounded-full w-7 h-7">
        {propGraphics}
      </span>
      <span>{template?.label}</span>
      <span className="italic font-normal">
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
