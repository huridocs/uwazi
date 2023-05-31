import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from 'app/V2/Components/UI/Breadcrumb';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Components/Breadcrumb/Item',
  component: Breadcrumb,
};

type Story = StoryObj<typeof Breadcrumb.Item>;

const Primary: Story = {
  render: args => (
    <MemoryRouter>
      <Provider store={createStore()}>
        <div className="tw-content">
          <Breadcrumb.Item url="#" className="w-20">
            {args.children}
          </Breadcrumb.Item>
        </div>
      </Provider>
    </MemoryRouter>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    children: 'Page title',
    url: '#',
  },
};
export { Basic };

export default meta;
