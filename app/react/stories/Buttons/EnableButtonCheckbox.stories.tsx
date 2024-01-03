import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { EnableButtonCheckbox } from 'app/V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Provider } from 'react-redux';

const meta: Meta<typeof EnableButtonCheckbox> = {
  title: 'Components/Forms/EnableButtonCheckbox',
  component: EnableButtonCheckbox,
  argTypes: {
    onChange: { action: 'changed' },
  },
};

type Story = StoryObj<typeof EnableButtonCheckbox>;

const Container = (args: any) => {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="tw-content">
      <EnableButtonCheckbox
        onChange={() => {
          args.onChange();
          setValue(!value);
        }}
        disabled={args.disabled}
        name={args.name}
        value={value}
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
    className: '',
    value: 'one',
    onChange: action('changed'),
  },
};

export { Basic };

export default meta;
