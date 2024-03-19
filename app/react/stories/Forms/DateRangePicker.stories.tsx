import React from 'react';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { DateRangePicker } from 'app/V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const meta: Meta<typeof DateRangePicker> = {
  title: 'Forms/DateRangePicker',
  component: DateRangePicker,
};

type Story = StoryObj<typeof DateRangePicker>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <DateRangePicker
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
