import React from 'react';
import { Translate, t } from 'app/I18N';
import { Pill } from 'V2/Components/UI';
import { ClientTemplateSchema } from 'V2/shared/types';
import {
  DatePropertyIcon,
  MarkdownPropertyIcon,
  NumericPropertyIcon,
  TextPropertyIcon,
  SelectPropertyIcon,
  RelationshipPropertyIcon,
} from 'V2/Components/CustomIcons';

const SuggestionsTitle = ({
  property,
  templates,
}: {
  property: string;
  templates: ClientTemplateSchema[];
}) => {
  const allProperties = [
    ...(templates[0].commonProperties || []),
    ...(templates[0].properties || []),
  ];
  const template = allProperties.find(prop => prop.name === property);

  let propGraphics: string | React.ReactNode = '_';

  switch (template?.type) {
    case 'date':
      propGraphics = <DatePropertyIcon className="w-3" />;
      break;
    case 'numeric':
      propGraphics = <NumericPropertyIcon className="w-3" />;
      break;
    case 'markdown':
      propGraphics = <MarkdownPropertyIcon className="w-3" />;
      break;
    case 'select':
    case 'multiselect':
      propGraphics = <SelectPropertyIcon className="w-3" />;
      break;
    case 'relationship':
      propGraphics = <RelationshipPropertyIcon className="w-3" />;
      break;
    default:
      propGraphics = <TextPropertyIcon className="w-3" />;
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-wrap gap-2 items-center text-gray-900 grow">
        <span className="flex justify-center items-center w-7 h-7 font-sans text-sm text-center text-gray-700 bg-indigo-200 rounded-full">
          {propGraphics}
        </span>
        <span className="text-base font-semibold">
          {t(templates[0]?._id, template?.label, null, false)}
        </span>
        <Translate className="italic font-normal">for</Translate>
        {templates.map(templateToDisplay => (
          <Pill
            color="gray"
            className="inline-flex items-center text-xs font-medium whitespace-nowrap"
            key={templateToDisplay._id}
          >
            {templateToDisplay.name}
          </Pill>
        ))}
      </div>
    </div>
  );
};

export { SuggestionsTitle };
