import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';

const NavigationHeaderStory = {
  title: 'Components/NavigationHeader',
  component: NavigationHeader,
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: 'iphone6',
    },
  },
};

const Template: ComponentStory<typeof NavigationHeader> = args => (
  <MemoryRouter>
    <div className="tw-content">
      <NavigationHeader backUrl={args.backUrl}>{args.children}</NavigationHeader>
    </div>
  </MemoryRouter>
);

const Basic = Template.bind({});
const WithLink = Template.bind({});

Basic.args = {
  children: <span>Page title</span>,
};

WithLink.args = {
  children: <span>Page title</span>,
  backUrl: '/backUrl',
};

export { Basic, WithLink };

export default NavigationHeaderStory as ComponentMeta<typeof NavigationHeader>;
