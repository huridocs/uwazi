import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { EnableButtonCheckbox } from 'app/V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Provider } from 'react-redux';

const meta: Meta<typeof EnableButtonCheckbox> = {
  title: 'Forms/EnableButtonCheckbox',
  component: EnableButtonCheckbox,
  argTypes: {
    onChange: { action: 'changed' },
  },
};

type Story = StoryObj<typeof EnableButtonCheckbox>;

const Container = (args: any) => {
  const [checked, setChecked] = React.useState(args.checked);
  return (
    <div className="tw-content">
      <EnableButtonCheckbox
        onChange={() => {
          console.log('changed');
          args.onChange();
          setChecked(!checked);
        }}
        disabled={args.disabled}
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
    name: 'option',
    disabled: false,
    checked: false,
    className: '',
    onChange: action('changed'),
  },
};

export { Basic };

export default meta;
