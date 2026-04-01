import { ModelEvents } from '../events.js';
import { ixStatus } from '../types.js';
import { createIXTaskListenerSetup, initialTaskLabel } from '../taskProgress.js';

const mockOn = jest.fn();
const mockOff = jest.fn();

jest.mock('#app/socket.js', () => ({
  socket: {
    on: (...args: any[]) => mockOn(...args),
    off: (...args: any[]) => mockOff(...args),
  },
}));

describe('taskProgress helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const labels = {
    trainingModel: 'Training model',
    findingSuggestions: 'Finding suggestions',
    acceptingSuggestions: 'Accepting suggestions',
  };

  it('builds initial label for train task', () => {
    expect(initialTaskLabel({ taskType: 'train', extractorName: 'Extractor A', labels })).toBe(
      'Training model: Extractor A'
    );
  });

  it('builds initial label for process task', () => {
    expect(initialTaskLabel({ taskType: 'process', extractorName: 'Extractor A', labels })).toBe(
      'Finding suggestions: Extractor A'
    );
  });

  it('subscribes and unsubscribes socket listeners', () => {
    const setup = createIXTaskListenerSetup({
      extractorId: 'ext1',
      extractorName: 'Extractor A',
      taskType: 'train',
      labels,
    });

    const cleanup = setup(jest.fn(), jest.fn(), jest.fn());

    expect(mockOn).toHaveBeenCalledWith(ModelEvents.MODEL_STATUS, expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith(ModelEvents.MODEL_ERROR, expect.any(Function));

    cleanup();

    expect(mockOff).toHaveBeenCalledWith(ModelEvents.MODEL_STATUS, expect.any(Function));
    expect(mockOff).toHaveBeenCalledWith(ModelEvents.MODEL_ERROR, expect.any(Function));
  });

  it('updates training label when processing_model in train mode', () => {
    const update = jest.fn();
    const complete = jest.fn();
    const fail = jest.fn();

    const setup = createIXTaskListenerSetup({
      extractorId: 'ext1',
      extractorName: 'Extractor A',
      taskType: 'train',
      labels,
    });
    setup(update, complete, fail);

    const statusCb = mockOn.mock.calls.find(call => call[0] === ModelEvents.MODEL_STATUS)?.[1];
    statusCb('ext1', ixStatus.processing_model, 'msg');

    expect(update).toHaveBeenCalledWith({ label: 'Training model: Extractor A' });
    expect(complete).not.toHaveBeenCalled();
    expect(fail).not.toHaveBeenCalled();
  });

  it('does not update training label when processing_model in process mode', () => {
    const update = jest.fn();
    const setup = createIXTaskListenerSetup({
      extractorId: 'ext1',
      extractorName: 'Extractor A',
      taskType: 'process',
      labels,
    });
    setup(update, jest.fn(), jest.fn());

    const statusCb = mockOn.mock.calls.find(call => call[0] === ModelEvents.MODEL_STATUS)?.[1];
    statusCb('ext1', ixStatus.processing_model, 'msg');

    expect(update).not.toHaveBeenCalled();
  });

  it('maps processing_suggestions to finding label and progress', () => {
    const update = jest.fn();
    const setup = createIXTaskListenerSetup({
      extractorId: 'ext1',
      extractorName: 'Extractor A',
      taskType: 'process',
      labels,
    });
    setup(update, jest.fn(), jest.fn());

    const statusCb = mockOn.mock.calls.find(call => call[0] === ModelEvents.MODEL_STATUS)?.[1];
    statusCb('ext1', ixStatus.processing_suggestions, 'msg', { processed: 2, total: 8 });

    expect(update).toHaveBeenCalledWith({
      label: 'Finding suggestions: Extractor A',
      progress: 25,
    });
  });

  it('maps processing_auto_accept to accepting label and progress', () => {
    const update = jest.fn();
    const setup = createIXTaskListenerSetup({
      extractorId: 'ext1',
      extractorName: 'Extractor A',
      taskType: 'process',
      labels,
    });
    setup(update, jest.fn(), jest.fn());

    const statusCb = mockOn.mock.calls.find(call => call[0] === ModelEvents.MODEL_STATUS)?.[1];
    statusCb('ext1', ixStatus.processing_auto_accept, 'msg', { processed: 3, total: 10 });

    expect(update).toHaveBeenCalledWith({
      label: 'Accepting suggestions: Extractor A',
      progress: 30,
    });
  });

  it('calls complete on ready', () => {
    const complete = jest.fn();
    const setup = createIXTaskListenerSetup({
      extractorId: 'ext1',
      extractorName: 'Extractor A',
      taskType: 'process',
      labels,
    });
    setup(jest.fn(), complete, jest.fn());

    const statusCb = mockOn.mock.calls.find(call => call[0] === ModelEvents.MODEL_STATUS)?.[1];
    statusCb('ext1', ixStatus.ready, 'Completed');

    expect(complete).toHaveBeenCalled();
  });

  it('calls fail on model error', () => {
    const fail = jest.fn();
    const setup = createIXTaskListenerSetup({
      extractorId: 'ext1',
      extractorName: 'Extractor A',
      taskType: 'process',
      labels,
    });
    setup(jest.fn(), jest.fn(), fail);

    const errorCb = mockOn.mock.calls.find(call => call[0] === ModelEvents.MODEL_ERROR)?.[1];
    errorCb({ message: 'boom' });

    expect(fail).toHaveBeenCalledWith('boom');
  });

  it('ignores events from other extractors', () => {
    const update = jest.fn();
    const complete = jest.fn();
    const setup = createIXTaskListenerSetup({
      extractorId: 'ext1',
      extractorName: 'Extractor A',
      taskType: 'process',
      labels,
    });
    setup(update, complete, jest.fn());

    const statusCb = mockOn.mock.calls.find(call => call[0] === ModelEvents.MODEL_STATUS)?.[1];
    statusCb('other', ixStatus.processing_suggestions, 'msg', { processed: 1, total: 2 });
    statusCb('other', ixStatus.ready, 'Completed');

    expect(update).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
  });
});
