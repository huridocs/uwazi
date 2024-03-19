import React from 'react';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from 'app/V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const meta: Meta<typeof DatePicker> = {
  title: 'Forms/DatePicker',
  component: DatePicker,
};

type Story = StoryObj<typeof DatePicker>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <DatePicker
        language={args.language}
        labelToday={args.labelToday}
        labelClear={args.labelClear}
      />
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    language: 'es-ec',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
  },
};

export { Basic };

export default meta;
