import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TaskItem } from '#V2/Components/UI/Notifications/TaskItem.js';
import { StatusTask } from '#V2/atoms/requestStatusAtom.js';

const meta: Meta<typeof TaskItem> = {
  title: 'Components/Notifications/TaskItem',
  component: TaskItem,
};
export default meta;

type Story = StoryObj<typeof TaskItem>;

const makeTask = (
  status: StatusTask['status'],
  label: string,
  progress?: number
): StatusTask => ({
  id: '1',
  status,
  label,
  progress,
});

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <div className="max-w-sm p-4">
        <TaskItem {...args} />
      </div>
    </div>
  ),
};

const Running: Story = {
  ...Primary,
  args: { task: makeTask('running', 'Uploading document batch...', 42) },
};

const RunningNoProgress: Story = {
  ...Primary,
  args: { task: makeTask('running', 'Processing entities...') },
};

const Completed: Story = {
  ...Primary,
  args: { task: makeTask('completed', 'Uploading document batch...', 100) },
};

const Failed: Story = {
  ...Primary,
  args: { task: makeTask('failed', 'Exporting CSV failed.', 67) },
};

export { Running, RunningNoProgress, Completed, Failed };
