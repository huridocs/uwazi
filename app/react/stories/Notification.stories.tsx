import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Notification } from 'V2/Components/UI/Notification';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const NotificationStory = {
  title: 'Components/Notification',
  component: Notification,
};

const Template: ComponentStory<typeof Notification> = args => (
  <Provider store={createStore()}>
    <div className="tw-content">
      <div className="max-w-xl">
        <Notification
          type={args.type}
          text={args.text}
          heading={args.heading}
          details={args.details}
        />
      </div>
    </div>
  </Provider>
);

const Basic = Template.bind({});
const WithHeading = Template.bind({});
const WithDetails = Template.bind({});

Basic.args = {
  type: 'success',
  text: `This is the text for the notification with a rather larger text that should eventually break to a new line. Then it has even more text.
  Then it has a next line because it's a long text. Then it has even more text.`,
  details: '',
  heading: '',
};

WithDetails.args = {
  ...Basic.args,
  details:
    'This is some extra information that should only appear when the user clicks on the view more button',
};

WithHeading.args = {
  ...Basic.args,
  heading: 'This is the title of the notification',
};

export { Basic, WithHeading, WithDetails };

export default NotificationStory as ComponentMeta<typeof Notification>;
