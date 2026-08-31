import React, { useState } from 'react';
import preview from '#storybook/preview';
import { Translate } from '#app/I18N/index.js';
import { DropdownListbox } from '#V2/Components/UI/DropdownListbox.js';

const sortOptions = [
  { id: 'none' as const, label: 'None' },
  { id: 'appearance' as const, label: 'Appearance' },
  { id: 'asc' as const, label: 'A → Z' },
  { id: 'desc' as const, label: 'Z → A' },
];

const meta = preview.meta({
  title: 'Components/UI/DropdownListbox',
  component: DropdownListbox,
});

const SortPreview = () => {
  const [value, setValue] = useState<(typeof sortOptions)[number]['id']>('appearance');
  return (
    <div className="tw-content p-4">
      <DropdownListbox
        prefix={<Translate>Sort:</Translate>}
        value={value}
        onChange={setValue}
        listAriaLabel="Sort order"
        options={sortOptions.map(option => ({
          id: option.id,
          label: <Translate>{option.label}</Translate>,
        }))}
      />
    </div>
  );
};

const Sort = meta.story({
  render: () => <SortPreview />,
});

const Disabled = meta.story({
  render: () => (
    <div className="tw-content p-4">
      <DropdownListbox
        prefix={<Translate>Then by:</Translate>}
        value="none"
        disabled
        onChange={() => undefined}
        listAriaLabel="Then by"
        minWidthClass="min-w-[180px]"
        options={[{ id: 'none', label: <Translate>None</Translate> }]}
      />
    </div>
  ),
});
export { Sort, Disabled };
