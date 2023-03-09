import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Header } from './Header';

const HeaderStory = {
  title: 'Components/Header',
  component: Header,
};

const Template: ComponentStory<typeof Header> = args => (
  <MemoryRouter>
    <div className="tw-content">
      <Header backUrl={args.backUrl}>{args.children}</Header>
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

export default HeaderStory as ComponentMeta<typeof Header>;
