import React, { useState } from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { ToggleButton } from 'V2/Components/UI/ToggleButton';

const ToggleButtonStory = {
  title: 'Components/ToggleButton',
  component: ToggleButton,
};

const Template: ComponentStory<typeof ToggleButton> = args => {
  const [show, setShow] = useState(false);
  return (
    <div className="tw-content">
      <ToggleButton onToggle={() => setShow(!show)} disabled={args.disabled}>
        <div className="ml-2">{args.children}</div>
      </ToggleButton>
      {show && <p className="pt-3">This text appears and hides using the above toggle</p>}
    </div>
  );
};

const Basic = Template.bind({});

Basic.args = {
  children: 'My toggle button',
  disabled: false,
};

export { Basic };

export default ToggleButtonStory as ComponentMeta<typeof ToggleButton>;
