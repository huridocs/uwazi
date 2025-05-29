import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
import { DateRange } from 'V2/Components/Forms/DatePicker/DateRange';

const meta: Meta<typeof DateRange> = {
  title: 'Forms/DateRangePicker',
  component: DateRange,
  args: {
    onChange: fn(),
    onBlur: fn(),
  },
  parameters: {
    actions: {
      handles: ['change', 'blur'],
    },
  },
};

type Story = StoryObj<typeof DateRange>;

const Basic: Story = {
  render: args => (
    <DateRange
      model={args.model}
      value={args.value}
      label={args.label}
      labelToday={args.labelToday}
      labelClear={args.labelClear}
      placeholderStart={args.placeholderStart}
      placeholderEnd={args.placeholderEnd}
      locale={args.locale}
      format={args.format}
      hideLabel={args.hideLabel}
      className={args.className}
      useTimezone={args.useTimezone}
      disabled={args.disabled}
      hasErrors={args.hasErrors}
      onChange={args.onChange}
      onBlur={args.onBlur}
      errorMessage={args.errorMessage}
      endOfDay={args.endOfDay}
    />
  ),
  args: {
    model: 'dateField',
    label: 'Rango de fechas',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    locale: 'es',
    format: 'dd-mm-yyyy',
    placeholderStart: 'Inicio',
    placeholderEnd: 'Fin',
    hideLabel: true,
    className: '',
    useTimezone: false,
    disabled: false,
    hasErrors: false,
    onChange: action('changed'),
    onBlur: action('blurred'),
  },
};

export { Basic };

export default meta;
