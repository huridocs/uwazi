import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { fn } from '@storybook/test';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
import { DateRangePicker } from '../../V2/Components/Forms.js';

const meta: Meta<typeof DateRangePicker> = {
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
};

type Story = StoryObj<typeof DateRangePicker>;

const Primary: Story = {
  render: args => (
    <div className="tw-container">
      <div className="mx-2">
        <DateRangePicker
          className="mx-2"
          // @ts-expect-error TS(2339): Property 'language' does not exist on type '{}'.
          language={args.language}
          // @ts-expect-error TS(2339): Property 'dateFormat' does not exist on type '{}'.
          dateFormat={args.dateFormat}
          // @ts-expect-error TS(2339): Property 'labelToday' does not exist on type '{}'.
          labelToday={args.labelToday}
          // @ts-expect-error TS(2339): Property 'labelClear' does not exist on type '{}'.
          labelClear={args.labelClear}
          // @ts-expect-error TS(2339): Property 'placeholderStart' does not exist on type... Remove this comment to see the full error message
          placeholderStart={args.placeholderStart}
          // @ts-expect-error TS(2339): Property 'placeholderEnd' does not exist on type '... Remove this comment to see the full error message
          placeholderEnd={args.placeholderEnd}
          // @ts-expect-error TS(2339): Property 'onFromDateSelected' does not exist on ty... Remove this comment to see the full error message
          onFromDateSelected={args.onFromDateSelected}
          // @ts-expect-error TS(2339): Property 'onToDateSelected' does not exist on type... Remove this comment to see the full error message
          onToDateSelected={args.onToDateSelected}
        />
      </div>
    </div>
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
