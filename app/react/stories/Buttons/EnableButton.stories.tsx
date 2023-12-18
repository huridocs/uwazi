import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { EnableButton } from 'app/V2/Components/UI';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Provider } from 'react-redux';

const meta: Meta<typeof EnableButton> = {
  title: 'Components/Buttons/EnableButton',
  component: EnableButton,
  argTypes: {
    onChange: { action: 'changed' },
  },
};

type Story = StoryObj<typeof EnableButton>;

const Container = (args: any) => {
  const [checked, setChecked] = React.useState(args.checked);
  return (
    <div className="tw-content">
      <EnableButton
        onChange={() => {
          args.onChange();
          setChecked(!checked);
        }}
        disabled={args.disabled}
        label={args.label}
        name={args.name}
        checked={checked}
      />
    </div>
  );
};

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <Container {...args} />
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    label: 'Click me!',
    name: 'drkmode',
    disabled: false,
    className: '',
    checked: true,
    onChange: action('changed'),
  },
};

export { Basic };

export default meta;
