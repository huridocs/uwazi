import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
import { DatePicker } from 'V2/Components/Forms/DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'Forms/DatePicker',
  component: DatePicker,
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

type Story = StoryObj<typeof DatePicker>;

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
      disabled={args.disabled}
      hasErrors={args.hasErrors}
      onChange={args.onChange}
      onBlur={args.onBlur}
      errorMessage={args.errorMessage}
      required={args.required}
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
    useTimezone: false,
    disabled: false,
    hasErrors: false,
    onChange: action('changed'),
    onBlur: action('blurred'),
    required: false,
  },
};

export { Basic };

export default meta;
