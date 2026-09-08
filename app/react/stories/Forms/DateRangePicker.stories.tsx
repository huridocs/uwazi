import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { action } from 'storybook/actions';
import { fn } from 'storybook/test';
import { DateRangePicker } from '#V2/Components/Forms/index.js';

const meta = preview.meta({
  title: 'Forms/DateRangePicker',
  component: DateRangePicker,
  args: {
    onFromDateSelected: fn(),
    onToDateSelected: fn(),
  },
  parameters: {
    actions: {
      handles: ['change'],
    },
  },
});

const Primary = meta.story({
  args: {
    language: 'es',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    placeholderStart: 'Inicio',
    placeholderEnd: 'Fin',
    onFromDateSelected: fn(),
    onToDateSelected: fn(),
    onClear: fn(),
  },
  render: args => (
    <div className="tw-container">
      <div className="mx-2">
        <DateRangePicker
          className="mx-2"
          language={args.language}
          labelToday={args.labelToday}
          labelClear={args.labelClear}
          placeholderStart={args.placeholderStart}
          placeholderEnd={args.placeholderEnd}
          onFromDateSelected={args.onFromDateSelected}
          onToDateSelected={args.onToDateSelected}
          from={args.from}
          to={args.to}
          onClear={args.onClear}
        />
      </div>
    </div>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    language: 'es',
    labelToday: 'Hoy',
    labelClear: 'Limpiar',
    placeholderStart: 'Inicio',
    placeholderEnd: 'Fin',
    onFromDateSelected: action('from-changed'),
    onToDateSelected: action('to-changed'),
    onClear: action('cleared'),
  },
});

export { Basic };
