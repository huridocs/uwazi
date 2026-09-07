import React, { useState } from 'react';
import preview from '#storybook/preview';
import { ActiveFilterChip } from '#V2/Components/UI/ActiveFilterChip.js';
import { QuerySearchBar } from '#V2/Components/UI/QuerySearchBar.js';

const searchTips = <p className="text-micro text-ink-secondary">AND OR NOT</p>;

const meta = preview.meta({
  title: 'Components/UI/QuerySearchBar',
  component: QuerySearchBar,
});

const BasicPreview = () => {
  const [value, setValue] = useState('');
  return (
    <div className="tw-content max-w-md p-4">
      <QuerySearchBar
        value={value}
        onChange={setValue}
        placeholder='Search  •  AND, OR, NOT, "exact", wild*'
        ariaLabel="Search"
        clearAriaLabel="Clear search"
        tipsAriaLabel="Search tips"
        tipsContent={searchTips}
      />
    </div>
  );
};

const WithChipsPreview = () => {
  const [value, setValue] = useState('status');
  const [sortActive, setSortActive] = useState(true);

  return (
    <div className="tw-content max-w-md p-4">
      <QuerySearchBar
        value={value}
        onChange={setValue}
        placeholder='Search  •  AND, OR, NOT, "exact", wild*'
        ariaLabel="Search relationships"
        clearAriaLabel="Clear search"
        tipsAriaLabel="Search tips"
        inlineSlot={
          sortActive ? (
            <ActiveFilterChip label="Z → A" onRemove={() => setSortActive(false)} />
          ) : null
        }
        tipsContent={searchTips}
      />
    </div>
  );
};

const Basic = meta.story({
  render: () => <BasicPreview />,
});

const WithChips = meta.story({
  render: () => <WithChipsPreview />,
});
export { Basic, WithChips };
