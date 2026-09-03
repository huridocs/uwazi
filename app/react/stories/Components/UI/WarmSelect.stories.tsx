import React, { useState } from 'react';
import preview from '#storybook/preview';
import { WarmSelect } from '#V2/Components/UI/index.js';

const meta = preview.meta({
  title: 'Design System/Shared/WarmSelect',
  component: WarmSelect,
  parameters: { layout: 'centered' },
});

const Demo = () => {
  const [value, setValue] = useState('all');
  return (
    <div className="tw-content">
      <WarmSelect
        value={value}
        onChange={setValue}
        ariaLabel="View filter"
        options={[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread' },
        ]}
      />
    </div>
  );
};

export const Default = meta.story({
  render: () => <Demo />,
});
