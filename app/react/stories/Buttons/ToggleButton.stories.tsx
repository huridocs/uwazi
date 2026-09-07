import React, { useState } from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { ToggleButton, ToggleButtonProps } from '#V2/Components/UI/ToggleButton.js';

const meta = preview.meta({
  title: 'Components/Buttons/ToggleButton',
  component: ToggleButton,
});

const ToggleButtonContainer = ({ children, disabled, size }: ToggleButtonProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className="tw-content">
      <ToggleButton onToggle={() => setShow(!show)} disabled={disabled} size={size}>
        <div>{children}</div>
      </ToggleButton>
      {show && <p className="pt-3">This text appears and hides using the above toggle</p>}
    </div>
  );
};
const Primary = meta.story({
  args: {
    children: 'My toggle button',
    disabled: false,
    size: 'regular',
  },
  render: args => (
    <ToggleButtonContainer disabled={args.disabled} size={args.size}>
      {args.children}
    </ToggleButtonContainer>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    children: 'My toggle button',
    disabled: false,
    size: 'regular',
  },
});

export { Basic };
