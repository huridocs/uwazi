/**
 * @jest-environment jsdom
 */
import { ApiClientEventBus } from '#shared/apiClient/index.js';
import { createLoadingPolicy } from '../policies.js';

describe('createLoadingPolicy', () => {
  it('ignores translation requests so a slow translation does not lock the page', () => {
    const eventBus = new ApiClientEventBus();
    const start = jest.fn();
    const end = jest.fn();
    createLoadingPolicy(eventBus, { start, end });

    eventBus.emit({ type: 'request:start', id: 'entity', method: 'POST', path: 'entities' });
    eventBus.emit({
      type: 'request:start',
      id: 'translation',
      method: 'POST',
      path: 'translationService',
    });
    eventBus.emit({ type: 'request:success', id: 'entity', durationMs: 1 });

    expect(start).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);
  });
});
