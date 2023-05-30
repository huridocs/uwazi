import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { Breadcrumb } from 'app/V2/Components/UI/Breadcrumb';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Components/NavigationHeader',
  component: Breadcrumb,
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: 'iphone6',
    },
  },
};

type Story = StoryObj<typeof Breadcrumb>;

const Primary: Story = {
  render: args => (
    <MemoryRouter>
      <Provider store={createStore()}>
        <div className="tw-content">
          <Breadcrumb backUrl={args.backUrl}>{args.children}</Breadcrumb>
        </div>
      </Provider>
    </MemoryRouter>
  ),
};
const Basic: Story = {
  ...Primary,
  args: {
    children: 'Page title',
  },
};

const WithLink = {
  ...Primary,
  args: {
    children: 'Page title',
    backUrl: '/backUrl',
  },
};

export { Basic, WithLink };

export default meta;
