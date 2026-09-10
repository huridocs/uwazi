/**
 * @jest-environment jsdom
 */
import React from 'react';
import { createStore, Provider } from 'jotai';
import { render, act } from '@testing-library/react';
import { requestStatusAtom, useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import type { TaskListenerSetup } from '#V2/atoms/requestStatusTypes.js';

const initialRequestStatus = {
  notifications: [],
  unreadNotificationIds: [],
  tasks: [],
  isConnected: true,
  isPanelOpen: false,
  isLoading: false,
};

describe('requestStatusAtom task failures', () => {
  const renderWithStore = (store: ReturnType<typeof createStore>) => {
    const captured: { registerTask?: ReturnType<typeof useRequestStatus>['registerTask'] } = {};

    const Consumer = () => {
      const { registerTask } = useRequestStatus();
      captured.registerTask = registerTask;
      return null;
    };

    store.set(requestStatusAtom, initialRequestStatus);

    render(
      <Provider store={store}>
        <Consumer />
      </Provider>
    );

    return captured;
  };

  it('should keep the reason a failing task reports, so the panel can show why it failed', () => {
    const store = createStore();
    const captured = renderWithStore(store);

    let failTask: (details?: string) => void = () => {};

    const listenerSetup: TaskListenerSetup = (_update, _complete, fail) => {
      failTask = fail;
      return () => {};
    };

    act(() => {
      captured.registerTask!('task-1', 'Training model: Extractor A', listenerSetup);
    });

    act(() => {
      failTask('There are not Entities for training the model');
    });

    const [task] = store.get(requestStatusAtom).tasks;

    expect(task).toMatchObject({
      id: 'task-1',
      status: 'failed',
      details: 'There are not Entities for training the model',
    });
  });

  it('should leave details unset when a task fails without a reason', () => {
    const store = createStore();
    const captured = renderWithStore(store);

    let failTask: (details?: string) => void = () => {};

    const listenerSetup: TaskListenerSetup = (_update, _complete, fail) => {
      failTask = fail;
      return () => {};
    };

    act(() => {
      captured.registerTask!('task-2', 'Training model: Extractor B', listenerSetup);
    });

    act(() => {
      failTask();
    });

    const [task] = store.get(requestStatusAtom).tasks;

    expect(task.status).toBe('failed');
    expect(task.details).toBeUndefined();
  });
});
