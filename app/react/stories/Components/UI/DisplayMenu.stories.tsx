import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DisplayMenu, DisplayMenuRow, WarmSelect } from '#V2/Components/UI/index.js';

const meta: Meta<typeof DisplayMenu> = {
  title: 'Components/UI/DisplayMenu',
  component: DisplayMenu,
};

type Story = StoryObj<typeof DisplayMenu>;

const Preview = () => {
  const [groupBy, setGroupBy] = useState('relation-type');
  const [sort, setSort] = useState('appearance');
  const modified = groupBy !== 'relation-type' || sort !== 'appearance';

  return (
    <div className="tw-content flex justify-end p-8">
      <DisplayMenu ariaLabel="Display options" modified={modified}>
        <DisplayMenuRow label="Group by">
          <WarmSelect
            value={groupBy}
            onChange={setGroupBy}
            ariaLabel="Group by"
            align="end"
            options={[
              { value: 'none', label: 'None' },
              { value: 'relation-type', label: 'Relation type' },
              { value: 'target-template', label: 'Target template' },
            ]}
          />
        </DisplayMenuRow>
        <DisplayMenuRow label="Sort">
          <WarmSelect
            value={sort}
            onChange={setSort}
            ariaLabel="Sort"
            align="end"
            options={[
              { value: 'appearance', label: 'Appearance' },
              { value: 'asc', label: 'A → Z' },
              { value: 'desc', label: 'Z → A' },
            ]}
          />
        </DisplayMenuRow>
      </DisplayMenu>
    </div>
  );
};

const Default: Story = {
  render: () => <Preview />,
};

export { Default };
export default meta;
