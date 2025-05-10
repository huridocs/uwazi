import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
import { DateRange } from 'V2/Components/Forms/DatePicker';
import { TestAtomStoreProvider } from 'V2/testing';
import { settingsAtom } from 'V2/atoms';

const meta: Meta<typeof DateRange> = {
  title: 'Forms/DateRangePicker',
  component: DateRange,
  args: {
    onFromDateSelected: fn(),
    onToDateSelected: fn(),
  },
  parameters: {
    actions: {
      handles: ['change'],
    },
  },
};

type Story = StoryObj<typeof DateRange>;

const Primary: Story = {
  render: args => (
    <div className="tw-container">
      <div className="mx-2">
        <DateRange
          className="mx-2"
          locale={args.locale}
          format={args.format}
          labelToday={args.labelToday}
          labelClear={args.labelClear}
          placeholderStart={args.placeholderStart}
          placeholderEnd={args.placeholderEnd}
          value={args.value}
          useTimezone={args.useTimezone}
          onFromDateSelected={args.onFromDateSelected}
          onToDateSelected={args.onToDateSelected} 
          />
      </div>
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    locale: 'es',
    format: 'dd-mm-yyyy',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    placeholderStart: 'Inicio',
    placeholderEnd: 'Fin',
    useTimezone: true,
    onFromDateSelected: action('changed'),
    onToDateSelected: action('blurred'),
  },
};

export { Basic };

export default meta;
