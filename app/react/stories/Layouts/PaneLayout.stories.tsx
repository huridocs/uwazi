import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PaneLayout } from 'V2/Components/Layouts/PaneLayout';

const meta: Meta<typeof PaneLayout> = {
  title: 'Layouts/PaneLayout',
  component: PaneLayout,
};

type Story = StoryObj<typeof PaneLayout>;

const Primary: Story = {
  render: _args => (
    <div className="tw-content">
      <PaneLayout>
        <PaneLayout.Pane key="pane-1">
          <PaneLayout.PaneHeading>Heading 1</PaneLayout.PaneHeading>
          <div>Content 1</div>
          <PaneLayout.PaneFooter>Footer 1</PaneLayout.PaneFooter>
        </PaneLayout.Pane>
        <PaneLayout.Pane key="pane-2">
          <PaneLayout.PaneHeading>Heading 2</PaneLayout.PaneHeading>
          <div>Content 2</div>
          <PaneLayout.PaneFooter>Footer 2</PaneLayout.PaneFooter>
        </PaneLayout.Pane>
      </PaneLayout>
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {},
};

export { Basic };

export default meta;
