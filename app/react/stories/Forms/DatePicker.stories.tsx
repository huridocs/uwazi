import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
import { DatePicker } from '#app/V2/Components/Forms/index.js';
import { TestAtomStoreProvider } from '#app/V2/testing/index.js';
import { settingsAtom } from '#app/V2/atoms/index.js';

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
        name={args.name}
        label={args.label}
        language={args.language}
        labelToday={args.labelToday}
        labelClear={args.labelClear}
        dateFormat={args.dateFormat}
        placeholder={args.placeholder}
        hideLabel={args.hideLabel}
        className={args.className}
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
    name: 'dateField',
    label: 'Fecha',
    language: 'es',
    dateFormat: 'dd-mm-yyyy',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    placeholder: 'Seleccione una fecha',
    hideLabel: true,
    className: '',
    onChange: action('changed'),
    onBlur: action('blurred'),
    clearFieldAction: action('cleared'),
  },
};

export { Basic };

export default meta;
