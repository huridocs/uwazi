import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { VerticalDrawer } from 'V2/Components/UI/VerticalDrawer';

const meta: Meta<typeof VerticalDrawer> = {
  title: 'Components/VerticalDrawer',
  component: VerticalDrawer,
};

type Story = StoryObj<typeof VerticalDrawer>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <div className="h-96 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <h2 className="mb-4 text-lg font-medium">Content above the drawer</h2>
          <p className="mb-4 text-gray-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
          <p className="mb-4 text-gray-600">
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
            mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit
            voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo
            inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
          <p className="mb-4 text-gray-600">
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
            consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro
            quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed
            quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat
            voluptatem.
          </p>
        </div>
        <VerticalDrawer
          title={args.title}
          maxHeight={args.maxHeight}
          defaultOpen={args.defaultOpen}
        >
          {args.children}
        </VerticalDrawer>
      </div>
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    title: 'Resolución de la Corte IDH. Supervisión de cumplimient',
    children: (
      <div className="p-4" data-testid="drawer-content">
        <ul>
          <li>1 - item 1</li>
          <li>2 - item 2</li>
          <li>3 - item 3</li>
        </ul>
      </div>
    ),
    maxHeight: '',
    defaultOpen: false,
  },
};

export { Basic };

export default meta;
