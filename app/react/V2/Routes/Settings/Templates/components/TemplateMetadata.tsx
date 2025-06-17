import React, { useState, useEffect } from 'react';
import { ColorPicker } from 'app/V2/Components/Forms/ColorPicker';
import { InputField } from 'app/V2/Components/Forms/InputField';
import { Checkbox } from 'app/V2/Components/Forms/Checkbox';
import { Select, OptionSchema } from 'app/V2/Components/Forms/Select';
import { Translate } from 'app/I18N/Translate';

const templateColors = [
  '#628ccf',
  '#ff8282',
  '#ff8a4c',
  '#faca15',
  '#16bdca',
  '#31c48d',
  '#9eb0fd',
  '#f17eb8',
  '#ac94fa',
  '#9ca3af',
];

export interface TemplateMetadataValues {
  name: string;
  color: string;
  entityViewPage: string;
}

export interface TemplateMetadataProps {
  value: TemplateMetadataValues;
  onChange: (value: TemplateMetadataValues) => void;
  pages: { value: string; label: string }[];
  nameError?: boolean;
  colorError?: boolean;
}

export const TemplateMetadata = ({
  value,
  onChange,
  pages,
  nameError,
  colorError,
}: TemplateMetadataProps) => {
  const [displayAsPage, setDisplayAsPage] = useState(!!value.entityViewPage);

  useEffect(() => {
    // If entityViewPage is set externally, enable checkbox
    if (value.entityViewPage && !displayAsPage) {
      setDisplayAsPage(true);
    }
    // If entityViewPage is cleared externally, disable checkbox
    if (!value.entityViewPage && displayAsPage) {
      setDisplayAsPage(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.entityViewPage]);

  const handleCheckboxChange = (checked: boolean) => {
    setDisplayAsPage(checked);
    if (!checked) {
      onChange({ ...value, entityViewPage: '' });
    }
  };

  return (
    <div className="flex gap-3 w-full py-2">
      <ColorPicker
        name="template-color"
        value={value.color}
        onChange={color => onChange({ ...value, color })}
        hasErrors={!!colorError}
        options={templateColors}
      />
      <InputField
        id="template-name"
        name="template-name"
        placeholder="Template name"
        value={value.name}
        onChange={e => onChange({ ...value, name: e.target.value })}
        className="flex-grow min-w-[120px]"
        clearFieldAction={value.name ? () => onChange({ ...value, name: '' }) : undefined}
        hasErrors={!!nameError}
        errorMessage={
          nameError && value.name ? <Translate>Template name already exists</Translate> : ''
        }
      />
      <div className="flex items-center h-10 gap-2 ml-4">
        {!pages.length && (
          <Translate className="text-sm font-medium text-gray-900">
            There are no pages enabled for entity view
          </Translate>
        )}
        {Boolean(pages.length) && (
          <>
            <Checkbox
              name="display-as-page"
              checked={displayAsPage}
              onChange={e => handleCheckboxChange((e.target as HTMLInputElement).checked)}
              label={<Translate>Display entity view from page</Translate>}
              className="mb-0"
            />
            <Select
              id="select-page"
              label=""
              options={[{ value: '', label: 'Select page' }, ...pages] as OptionSchema[]}
              value={value.entityViewPage}
              onChange={e => onChange({ ...value, entityViewPage: e.target.value })}
              disabled={!displayAsPage}
              className="w-36"
              hideLabel
            />
          </>
        )}
      </div>
    </div>
  );
};
