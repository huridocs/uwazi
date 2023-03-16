import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Notification } from './Notification';

const NotificationStory = {
  title: 'Components/Notification',
  component: Notification,
};

const Template: ComponentStory<typeof Notification> = args => (
  <div className="tw-content">
    <Notification type={args.type} text={args.text} heading={args.heading} details={args.details} />
  </div>
);

const Basic = Template.bind({});
const WithHeading = Template.bind({});

Basic.args = {
  type: 'sucess',
  text: `This is the text for the notification with a rather larger text that should eventually break to a new line. Then it has even more text.
  Then it has a next line because it's a long text. Then it has even more text.`,
  details:
    'This is some extra information that should only appear when the user clicks on the view more button',
};

WithHeading.args = {
  ...Basic.args,
  heading: 'This is the title of the notification',
};

export { Basic, WithHeading };

export default NotificationStory as ComponentMeta<typeof Notification>;
