import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { TaskItem } from '#V2/Components/UI/Notifications/TaskItem.js';
import { StatusTask } from '#V2/atoms/requestStatusAtom.js';

const meta = preview.meta({
  title: 'Components/Notifications/TaskItem',
  component: TaskItem,
});

const makeTask = (status: StatusTask['status'], label: string, progress?: number): StatusTask => ({
  id: '1',
  status,
  label,
  progress,
});

const Primary = meta.story({
  args: {
    task: makeTask('running', 'Uploading document batch...', 42),
    onRemove: () => {},
  },
  render: args => (
    <div className="tw-content">
      <div className="max-w-sm p-4">
        <TaskItem {...args} />
      </div>
    </div>
  ),
});

const Running = storyExtend(Primary, {
  args: { task: makeTask('running', 'Uploading document batch...', 42) },
});

const RunningNoProgress = storyExtend(Primary, {
  args: { task: makeTask('running', 'Processing entities...') },
});

const Completed = storyExtend(Primary, {
  args: { task: makeTask('completed', 'Uploading document batch...', 100) },
});

const Failed = storyExtend(Primary, {
  args: { task: makeTask('failed', 'Exporting CSV failed.', 67) },
});

export { Running, RunningNoProgress, Completed, Failed };
