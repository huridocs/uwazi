import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Notification } from 'V2/Components/UI/Notification';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const meta: Meta<typeof Notification> = {
  title: 'Components/Notification',
  component: Notification,
};

type Story = StoryObj<typeof Notification>;

const NotificationStory: Story = {
  render: args => (
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
  ),
};

const Basic: Story = {
  ...NotificationStory,
  args: {
    type: 'success',
    text: `This is the text for the notification with a rather larger text that should eventually break to a new line. Then it has even more text.
  Then it has a next line because it's a long text. Then it has even more text.`,
    details: '',
    heading: '',
  },
};

const WithDetails: Story = {
  ...NotificationStory,
  args: {
    ...Basic.args,
    details:
      'This is some extra information that should only appear when the user clicks on the view more button',
  },
};

const WithHeading: Story = {
  ...NotificationStory,
  args: {
    ...Basic.args,
    heading: 'This is the title of the notification',
  },
};

export { Basic, WithHeading, WithDetails };

export default meta;
