import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { InputField } from 'V2/Components/UI/InputField';

const InputFieldStory = {
  title: 'Components/InputField',
  component: InputField,
};

const Template: ComponentStory<typeof InputField> = args => (
  <Provider store={createStore()}>
    <div className="tw-content">
      <div className="md:w-1/2">
        <InputField
          fieldID={args.fieldID}
          label={<p className="text-lg mb-2">{args.label}</p>}
          disabled={args.disabled}
          hideLabel={args.hideLabel}
          hasErrors={args.hasErrors}
          clearFieldAction={args.clearFieldAction}
          placeholder={args.placeholder}
        />
      </div>
    </div>
  </Provider>
);

const Basic = Template.bind({});
const WithClearFieldButton = Template.bind({});

Basic.args = {
  fieldID: '1',
  label: 'Input field label',
  disabled: false,
  hideLabel: false,
  hasErrors: false,
  placeholder: 'Users can get a hint of what value is expected in this field',
};

WithClearFieldButton.args = {
  ...Basic.args,
  clearFieldAction: () => {},
};

export { Basic, WithClearFieldButton };

export default InputFieldStory as ComponentMeta<typeof InputField>;
