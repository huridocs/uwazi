import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { WarmSelect } from '#V2/Components/UI/index.js';

const meta: Meta<typeof WarmSelect> = {
  title: 'Design System/Shared/WarmSelect',
  component: WarmSelect,
  parameters: { layout: 'centered' },
};

type Story = StoryObj<typeof WarmSelect>;

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

export const Default: Story = {
  render: () => <Demo />,
};

export default meta;
