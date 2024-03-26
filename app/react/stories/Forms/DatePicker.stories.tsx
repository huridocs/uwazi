import React from 'react';
import { Provider } from 'react-redux';
import { RecoilRoot } from 'recoil';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { DatePicker } from 'app/V2/Components/Forms';
import { LEGACY_createStore as createStore, recoilGlobalState } from 'V2/shared/testingHelpers';

const meta: Meta<typeof DatePicker> = {
  title: 'Forms/DatePicker',
  component: DatePicker,
  argTypes: {
    onChange: { action: 'onChange' },
    onBlur: { action: 'onBlur' },
    clearFieldAction: { action: 'clearFieldAction' },
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
    <Provider store={createStore()}>
      <RecoilRoot initializeState={recoilGlobalState()}>
        <DatePicker
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
      </RecoilRoot>
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
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
