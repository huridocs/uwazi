import React, { useId } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ProgressBar } from '#V2/Components/UI/ProgressBar.js';
import { UwaziLoader } from '#V2/Components/UI/UwaziLoader.js';
import { type StatusTask, type TaskStatus } from '#V2/atoms/requestStatusAtom.js';

interface TaskItemProps {
  task: StatusTask;
  onRemove: (id: string) => void;
}

const statusIcon: Record<TaskStatus, React.ReactNode> = {
  running: (
    <span className="flex shrink-0 items-center">
      <UwaziLoader size="xs" color="carbon" animate />
    </span>
  ),
  completed: <CheckCircleIcon className="h-4 w-4 shrink-0 text-success" />,
  failed: <XCircleIcon className="h-4 w-4 shrink-0 text-emphasis" />,
};

const statusLabel: Record<TaskStatus, string> = {
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
};

const statusLabelColor: Record<TaskStatus, string> = {
  running: 'text-supporting',
  completed: 'text-success',
  failed: 'text-emphasis',
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
    <div className="flex flex-col gap-2 rounded-lg border border-border-soft bg-paper px-3 py-2.5">
      <div className="flex items-center gap-2">
        {statusIcon[task.status]}
        <span id={taskLabelId} className="flex-1 truncate text-[13px] font-medium text-ink">
          {task.label}
        </span>
        <span className={`shrink-0 text-[11px] font-medium ${statusLabelColor[task.status]}`}>
          {statusLabel[task.status]}
        </span>
        <button
          type="button"
          onClick={() => onRemove(task.id)}
          aria-label="Hide task"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-ink-muted transition-colors hover:bg-warm hover:text-ink-secondary"
        >
          <XMarkIcon className="h-[13px] w-[13px]" aria-hidden="true" />
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
          <span className="w-8 shrink-0 text-right text-[11px] font-semibold text-ink-tertiary">
            {task.progress}%
          </span>
        </div>
      )}
    </div>
  );
};

export type { TaskItemProps };
export { TaskItem };
