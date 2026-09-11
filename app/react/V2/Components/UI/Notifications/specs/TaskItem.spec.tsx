/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskItem } from '../TaskItem.js';

describe('TaskItem', () => {
  it('should show why a task failed', () => {
    render(
      <TaskItem
        task={{
          id: 'task-1',
          label: 'Training model: Extractor A',
          status: 'failed',
          details: 'There are not Entities for training the model',
        }}
        onRemove={jest.fn()}
      />
    );

    expect(screen.getByText('There are not Entities for training the model')).toBeInTheDocument();
  });

  it('should not show details for a task that is still running', () => {
    render(
      <TaskItem
        task={{
          id: 'task-1',
          label: 'Training model: Extractor A',
          status: 'running',
          details: 'a reason that does not apply yet',
        }}
        onRemove={jest.fn()}
      />
    );

    expect(screen.queryByText('a reason that does not apply yet')).not.toBeInTheDocument();
  });

  it('should render a failed task with no details without complaining', () => {
    render(
      <TaskItem
        task={{ id: 'task-1', label: 'Training model: Extractor A', status: 'failed' }}
        onRemove={jest.fn()}
      />
    );

    expect(screen.getByText('Training model: Extractor A')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
