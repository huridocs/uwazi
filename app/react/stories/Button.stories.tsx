import React from 'react';
import { StoryFn } from '@storybook/react';
import { Button } from 'V2/Components/UI/Button';

const ButtonStory = {
  title: 'Components/Button',
  component: Button,
};

const Template: StoryFn<typeof Button> = args => (
  <div className="tw-content">
    <Button buttonStyle={args.buttonStyle} size={args.size} disabled={args.disabled}>
      {args.children}
    </Button>
  </div>
);

const Basic = Template.bind({});

Basic.args = {
  buttonStyle: 'primary',
  size: 'medium',
  disabled: false,
  children: 'Button name',
};

export { Basic };

export default { component: ButtonStory };
