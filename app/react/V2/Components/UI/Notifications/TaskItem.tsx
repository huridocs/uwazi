import React, { useId } from 'react';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { ProgressBar } from '#V2/Components/UI/ProgressBar.js';
import { StatusTask, TaskStatus } from '#V2/atoms/requestStatusAtom.js';

interface TaskItemProps {
  task: StatusTask;
  onRemove: (id: string) => void;
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

const TaskItem = ({ task, onRemove }: TaskItemProps) => {
  const taskLabelId = useId();
  const progressValue = task.progress ?? 0;
  const progressValueText = `${statusLabel[task.status]} - ${Math.round(progressValue)}%`;

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2">
        {statusIcon[task.status]}
        <span id={taskLabelId} className="flex-1 text-sm font-medium text-gray-800 truncate">
          {task.label}
        </span>
        <span className={`text-xs font-medium ${statusLabelColor[task.status]}`}>
          {statusLabel[task.status]}
        </span>
        <button
          type="button"
          onClick={() => onRemove(task.id)}
          aria-label="Hide task"
          className="ml-1 rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
        >
          <XMarkIcon className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {task.progress !== undefined && (
        <div className="flex items-center gap-2">
          <ProgressBar
            progress={progressValue}
            color={progressColor[task.status]}
            className="flex-1"
            ariaLabelledby={taskLabelId}
            ariaValueText={progressValueText}
          />
          <span className="text-xs text-gray-400 w-8 text-right shrink-0">{task.progress}%</span>
        </div>
      )}
    </div>
  );
};

export type { TaskItemProps };
export { TaskItem };
