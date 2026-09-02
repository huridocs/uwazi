import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { EnableButtonCheckbox } from '#V2/Components/Forms/index.js';

const meta = preview.meta({
  title: 'Forms/EnableButtonCheckbox',
  component: EnableButtonCheckbox,
});

const Primary = meta.story({
  args: {
    name: 'option',
    disabled: false,
    defaultChecked: false,
    onChange: () => {},
  },
  render: args => (
    <div className="tw-content">
      <EnableButtonCheckbox
        disabled={args.disabled}
        name={args.name}
        defaultChecked={args.defaultChecked}
        onChange={args.onChange}
      />
    </div>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    name: 'option',
    disabled: false,
    defaultChecked: false,
    onChange: () => {},
  },
});

export { Basic };
