import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/solid';
import { Translate, t } from 'app/I18N';
import { Pill, Button } from 'app/V2/Components/UI';
import { ClientTemplateSchema } from 'app/istore';
import {
  DatePropertyIcon,
  MarkdownPropertyIcon,
  NumericPropertyIcon,
  TextPropertyIcon,
} from 'app/V2/Components/CustomIcons';

const SuggestionsTitle = ({
  property,
  templates,
  onFiltersButtonClicked,
}: {
  property: string;
  templates: ClientTemplateSchema[];
  onFiltersButtonClicked: () => void;
}) => {
  const allProperties = [...(templates[0].commonProperties || []), ...templates[0].properties];
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
    default:
      propGraphics = <TextPropertyIcon className="w-3" />;
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-wrap gap-2 content-center grow">
        <span className="flex justify-center items-center w-7 h-7 font-sans text-sm text-center text-gray-700 bg-indigo-200 rounded-full">
          {propGraphics}
        </span>
        <span>{t(templates[0]?._id, template?.label, null, false)}</span>
        <span className="italic font-normal">
          <Translate>for</Translate>
        </span>
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

      <div className="flex-none">
        <Button size="small" styling="light" onClick={onFiltersButtonClicked}>
          <FunnelIcon className="inline px-1 w-5 text-gray-800" />
          <Translate>Stats & Filters</Translate>
        </Button>
      </div>
    </div>
  );
};

export { SuggestionsTitle };
