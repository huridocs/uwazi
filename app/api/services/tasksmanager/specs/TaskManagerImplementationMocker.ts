import { ResultsMessage, Service, TaskManager } from '../TaskManager';

function mockTaskManagerImpl(taskManager: jest.Mock<TaskManager>) {
  const mock = {
    startTask: jest.fn().mockImplementation(() => {}),
  };
  let _service: Service;
  const trigger = async (result: ResultsMessage) => {
    // @ts-ignore
    await _service.processResults(result);
  };

  taskManager.mockImplementation((service: Service) => {
    _service = service;
    return mock as unknown as TaskManager;
  });

  return { mock, trigger } as { mock: Partial<TaskManager>; trigger: (m: ResultsMessage) => void };
}

export { mockTaskManagerImpl };
