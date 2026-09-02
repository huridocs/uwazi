import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { action } from 'storybook/actions';
import { fn } from 'storybook/test';
import { DatePicker } from '#V2/Components/Forms/index.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { settingsAtom } from '#V2/atoms/index.js';

const meta = preview.meta({
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
});

const Primary = meta.story({
  args: {
    name: 'dateField',
    label: 'Fecha',
    language: 'es',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    placeholder: 'Seleccione una fecha',
    hideLabel: true,
    className: '',
    onChange: fn(),
    onBlur: fn(),
    clearFieldAction: fn(),
  },
  render: args => (
    <TestAtomStoreProvider initialValues={[[settingsAtom, {}]]}>
      <DatePicker
        name={args.name}
        label={args.label}
        language={args.language}
        labelToday={args.labelToday}
        labelClear={args.labelClear}
        placeholder={args.placeholder}
        hideLabel={args.hideLabel}
        className={args.className}
        onChange={args.onChange}
        onBlur={args.onBlur}
        clearFieldAction={args.clearFieldAction}
        value={args.value}
      />
    </TestAtomStoreProvider>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    name: 'dateField',
    label: 'Fecha',
    language: 'es',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    placeholder: 'Seleccione una fecha',
    hideLabel: true,
    className: '',
    onChange: action('changed'),
    onBlur: action('blurred'),
    clearFieldAction: action('cleared'),
  },
});

export { Basic };
