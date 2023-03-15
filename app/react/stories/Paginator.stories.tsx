import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Paginator } from './Paginator';

const PaginatorStory = {
  title: 'Components/Paginator',
  component: Paginator,
};

const Template: ComponentStory<typeof Paginator> = args => (
  <div className="tw-content">
    <Paginator
      page={args.page}
      onNextClick={args.onNextClick}
      onPreviousClick={args.onPreviousClick}
    />
  </div>
);

const Basic = Template.bind({});

Basic.args = {
  page: 21,
  onNextClick: () => {},
  onPreviousClick: () => {},
};

export { Basic };

export default PaginatorStory as ComponentMeta<typeof Paginator>;
