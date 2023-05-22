import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const meta: Meta<typeof NavigationHeader> = {
  title: 'Components/NavigationHeader',
  component: NavigationHeader,
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: 'iphone6',
    },
  },
};

type Story = StoryObj<typeof NavigationHeader>;

const NavigationHeaderStory: Story = {
  render: args => (
    <MemoryRouter>
      <Provider store={createStore()}>
        <div className="tw-content">
          <NavigationHeader backUrl={args.backUrl}>{args.children}</NavigationHeader>
        </div>
      </Provider>
    </MemoryRouter>
  ),
};
const Basic: Story = {
  ...NavigationHeaderStory,
  args: {
    children: 'Page title',
  },
};

const WithLink = {
  ...NavigationHeaderStory,
  args: {
    children: 'Page title',
    backUrl: '/backUrl',
  },
};

export { Basic, WithLink };

export default meta;
