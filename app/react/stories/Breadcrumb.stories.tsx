import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { Breadcrumb } from 'app/V2/Components/UI/Breadcrumb';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

import { Basic as BreadcrumbItem } from './BreadcrumbItem.stories';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: 'iphone6',
    },
  },
  argTypes: {
    title: { control: 'text' },
  },
  args: {
    //👇 Now all Button stories will be primary.
    title: 'text',
  },
};

type Story = StoryObj<typeof Breadcrumb>;

const Primary: Story = {
  render: ({ items, title }) => (
    <MemoryRouter>
      <Provider store={createStore()}>
        <div className="tw-content">
          <Breadcrumb>
            {items.map(item => (
              <Breadcrumb.Item {...item} />
            ))}
            <span className="inline-flex items-center w-32 m-0 text-base font-medium text-gray-700 sm:gap-6 600 dark:text-gray-400 md:w-60 ">
              {title}
            </span>
          </Breadcrumb>
        </div>
      </Provider>
    </MemoryRouter>
  ),
};
const Basic: Story = {
  ...Primary,
  args: {
    title: 'Main content',
    items: [{ ...BreadcrumbItem.args }, { ...BreadcrumbItem.args }],
  },
};
export { Basic };

export default meta;
