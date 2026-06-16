import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Translate } from '#app/I18N/index.js';
import { ActiveFilterChip } from '#V2/Components/UI/ActiveFilterChip.js';
import { QuerySearchBar } from '#V2/Components/UI/QuerySearchBar.js';

const searchTips = (
  <>
    <div className="mb-1.5 text-xs font-semibold text-ink">
      <Translate>Search tips</Translate>
    </div>
    <ul className="space-y-1 text-ink-secondary">
      <li>
        <code className="font-mono text-[10px] text-ink">AND OR NOT</code> — boolean
      </li>
      <li>
        <code className="font-mono text-[10px] text-ink">&quot;exact phrase&quot;</code> — match
        verbatim
      </li>
    </ul>
  </>
);

const meta: Meta<typeof QuerySearchBar> = {
  title: 'Components/UI/QuerySearchBar',
  component: QuerySearchBar,
};

type Story = StoryObj<typeof QuerySearchBar>;

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

const Basic: Story = {
  render: () => <BasicPreview />,
};

const WithChips: Story = {
  render: () => <WithChipsPreview />,
};

export default meta;
export { Basic, WithChips };
