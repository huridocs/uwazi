import React from 'react';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { DateRangePicker } from 'app/V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const meta: Meta<typeof DateRangePicker> = {
  title: 'Forms/DateRangePicker',
  component: DateRangePicker,
  argTypes: {
    onFromDateSelected: { action: 'onFromDateSelected' },
    onToDateSelected: { action: 'onToDateSelected' },
  },
  parameters: {
    actions: {
      handles: ['change'],
    },
  },
};

type Story = StoryObj<typeof DateRangePicker>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <DateRangePicker
        language={args.language}
        dateFormat={args.dateFormat}
        labelToday={args.labelToday}
        labelClear={args.labelClear}
        placeholderStart={args.placeholderStart}
        placeholderEnd={args.placeholderEnd}
        onFromDateSelected={args.onFromDateSelected}
        onToDateSelected={args.onToDateSelected}
      />
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    language: 'es',
    dateFormat: 'dd-mm-yyyy',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    placeholderStart: 'Inicio',
    placeholderEnd: 'Fin',
    onFromDateSelected: action('changed'),
    onToDateSelected: action('blurred'),
  },
};

export { Basic };

export default meta;
