import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
import { TestAtomStoreProvider } from 'V2/testing';
import { settingsAtom } from 'V2/atoms';
import { DatePicker } from 'app/V2/Components/Forms/DatePicker';

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

const Primary: Story = {
  render: args => (
    <TestAtomStoreProvider initialValues={[[settingsAtom, { dateFormat: 'dd-mm-yyyy' }]]}>
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
    </TestAtomStoreProvider>
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

export { Basic };

export default meta;
