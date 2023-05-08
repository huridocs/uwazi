import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { StoryFn } from '@storybook/react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const NavigationHeaderStory = {
  title: 'Components/NavigationHeader',
  component: NavigationHeader,
};

const Template: StoryFn<typeof NavigationHeader> = args => (
  <MemoryRouter>
    <Provider store={createStore()}>
      <div className="tw-content">
        <NavigationHeader backUrl={args.backUrl}>{args.children}</NavigationHeader>
      </div>
    </Provider>
  </MemoryRouter>
);

const Basic = Template.bind({});
const WithLink = Template.bind({});

Basic.args = {
  children: 'Page title',
};

WithLink.args = {
  children: 'Page title',
  backUrl: '/backUrl',
};

export { Basic, WithLink };

export default {
  component: NavigationHeaderStory,
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: 'iphone6',
    },
  },
};
