import React from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid';
import { ProgressBar } from '#V2/Components/UI/ProgressBar.js';
import { StatusTask, TaskStatus } from '#V2/atoms/requestStatusAtom.js';

interface TaskItemProps {
  task: StatusTask;
}

const statusIcon: Record<TaskStatus, React.ReactNode> = {
  running: <ArrowPathIcon className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />,
  completed: <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" />,
  failed: <XCircleIcon className="w-4 h-4 text-pink-500 shrink-0" />,
};

const statusLabel: Record<TaskStatus, string> = {
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

const statusLabelColor: Record<TaskStatus, string> = {
  running: 'text-indigo-600',
  completed: 'text-green-600',
  failed: 'text-pink-600',
};

const progressColor: Record<TaskStatus, 'primary' | 'success' | 'error'> = {
  running: 'primary',
  completed: 'success',
  failed: 'error',
};

const TaskItem = ({ task }: TaskItemProps) => (
  <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-gray-200 bg-gray-50">
    <div className="flex items-center gap-2">
      {statusIcon[task.status]}
      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{task.label}</span>
      <span className={`text-xs font-medium ${statusLabelColor[task.status]}`}>
        {statusLabel[task.status]}
      </span>
    </div>

    {task.progress !== undefined && (
      <div className="flex items-center gap-2">
        <ProgressBar
          progress={task.progress}
          color={progressColor[task.status]}
          className="flex-1"
        />
        <span className="text-xs text-gray-400 w-8 text-right shrink-0">{task.progress}%</span>
      </div>
    )}
  </div>
);

export type { TaskItemProps };
export { TaskItem };
