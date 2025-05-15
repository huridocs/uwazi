import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
import { DatePicker } from 'V2/Components/Forms/DatePicker/DatePicker';
import { DateRange } from 'V2/Components/Forms/DatePicker/DateRange';

const meta: Meta<typeof DatePicker> = {
  title: 'Forms/DatePicker',
  component: DatePicker,
  args: {
    onChange: fn(),
    onBlur: fn(),
    clearFieldAction: fn(),
  },
  parameters: {
    actions: {
      handles: ['change'],
    },
  },
};

type Story = StoryObj<typeof DatePicker>;

type DateRangeStory = StoryObj<typeof DateRange>;

const Primary: Story = {
  render: args => (
    <DatePicker
      model={args.model}
      value={args.value}
      label={args.label}
      labelToday={args.labelToday}
      labelClear={args.labelClear}
      placeholder={args.placeholder}
      locale={args.locale}
      format={args.format}
      hideLabel={args.hideLabel}
      className={args.className}
      useTimezone={args.useTimezone}
      onChange={args.onChange}
      onBlur={args.onBlur}
      clearFieldAction={args.clearFieldAction}
    />
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    model: 'dateField',
    label: 'Fecha',
    locale: 'es',
    format: 'dd-mm-yyyy',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    placeholder: 'Seleccione una fecha',
    hideLabel: true,
    className: '',
    useTimezone: true,
    onChange: action('changed'),
    onBlur: action('blurred'),
    clearFieldAction: action('cleared'),
  },
};

const FormIntegration: Story = {
  ...Primary,
  args: {
    model: 'metadata.dateField',
    label: 'Form Date Field',
    locale: 'es',
    format: 'dd-mm-yyyy',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    placeholder: 'Seleccione una fecha',
    hideLabel: false,
    className: '',
    useTimezone: true,
    onChange: action('changed'),
    onBlur: action('blurred'),
    clearFieldAction: action('cleared'),
  },
};

const DateRangeBasic: DateRangeStory = {
  render: args => (
    <DateRange
      model={args.model}
      value={args.value}
      label={args.label}
      placeholderStart={args.placeholderStart}
      placeholderEnd={args.placeholderEnd}
      locale={args.locale}
      format={args.format}
      hideLabel={args.hideLabel}
      className={args.className}
      useTimezone={args.useTimezone}
      onChange={args.onChange}
      onBlur={args.onBlur}
      clearFieldAction={args.clearFieldAction}
    />
  ),
  args: {
    model: 'dateField',
    label: 'Rango de fechas',
    locale: 'es',
    format: 'dd-mm-yyyy',
    placeholderStart: 'Inicio',
    placeholderEnd: 'Fin',
    hideLabel: true,
    className: '',
    useTimezone: true,
    onChange: action('changed'),
    onBlur: action('blurred'),
    clearFieldAction: action('cleared'),
  },
};

export { Basic, DateRangeBasic, FormIntegration };

export default meta;
