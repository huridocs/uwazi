import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Button } from './Button';

const ButtonStory = {
  title: 'Components/Button',
  component: Button,
};

const Template: ComponentStory<typeof Button> = args => (
  <div className="tw-content">
    <Button type={args.type} onClickFuntion={args.onClickFuntion}>
      {args.children}
    </Button>
  </div>
);

const Basic = Template.bind({});

Basic.args = {
  children: <span>Button name</span>,
  type: 'primary',
  onClickFuntion: () => {},
};

export { Basic };

export default ButtonStory as ComponentMeta<typeof Button>;
