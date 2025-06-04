import React, { useState, useEffect } from 'react';
import { ColorPicker } from 'app/V2/Components/Forms/ColorPicker';
import { InputField } from 'app/V2/Components/Forms/InputField';
import { Checkbox } from 'app/V2/Components/Forms/Checkbox';
import { Select, OptionSchema } from 'app/V2/Components/Forms/Select';

export interface TemplateMetadataValues {
  name: string;
  color: string;
  entityViewPage: string;
}

export interface TemplateMetadataProps {
  value: TemplateMetadataValues;
  onChange: (value: TemplateMetadataValues) => void;
  pages: { value: string; label: string }[];
}

export const TemplateMetadata = ({ value, onChange, pages }: TemplateMetadataProps) => {
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
    <div className="flex items-center gap-3 w-full py-2">
      <ColorPicker
        name="template-color"
        value={value.color}
        onChange={color => onChange({ ...value, color })}
      />
      <InputField
        id="template-name"
        name="template-name"
        placeholder="Template name"
        value={value.name}
        onChange={e => onChange({ ...value, name: e.target.value })}
        className="w-96"
        clearFieldAction={value.name ? () => onChange({ ...value, name: '' }) : undefined}
      />
      <div className="flex items-center gap-2 ml-4">
        <Checkbox
          name="display-as-page"
          checked={displayAsPage}
          onChange={e => handleCheckboxChange((e.target as HTMLInputElement).checked)}
          label={<span className="text-gray-700">Display entity view from page</span>}
          className="mb-0"
        />
        <Select
          id="select-page"
          label=""
          options={[{ value: '', label: 'Select page' }, ...pages] as OptionSchema[]}
          value={value.entityViewPage}
          onChange={e => onChange({ ...value, entityViewPage: e.target.value })}
          disabled={!displayAsPage}
          className="min-w-[120px] w-36"
          hideLabel
        />
      </div>
    </div>
  );
};
