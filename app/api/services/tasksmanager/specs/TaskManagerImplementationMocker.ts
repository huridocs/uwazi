import { ResultsMessage, Service, TaskManager } from '../TaskManager';
let i = 0;
export function mockTaskManagerImpl(taskManager: jest.Mock<TaskManager>) {
  console.log('mocking')
  const mock = {
    startTask: jest.fn().mockImplementation(() => { console.log('using mock')}),
  };
  let _service: Service;
  const trigger = (result: ResultsMessage) => {
    // @ts-ignore
    _service.processResults(result);
  };

  taskManager.mockImplementation(function(service: Service) {
    _service = service;
    return mock as unknown as TaskManager;
  });

  return { mock, trigger } as { mock: Partial<TaskManager>, trigger: (m: ResultsMessage) => void }
}